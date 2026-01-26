import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
require('dotenv').config();

const openaiApiKey = process.env.OPENAI_API_KEY || '';
const pineconeApiKey = process.env.PINECONE_API_KEY || '';
const pineconeIndexName = process.env.PINECONE_INDEX_NAME || '';

if (!openaiApiKey) {
  console.warn('⚠️  Warning: OPENAI_API_KEY not set. RAG ingestion will not work.');
}

if (!pineconeApiKey) {
  console.warn('⚠️  Warning: PINECONE_API_KEY not set. RAG ingestion will not work.');
}

if (!pineconeIndexName) {
  console.warn('⚠️  Warning: PINECONE_INDEX_NAME not set. RAG ingestion will not work.');
}

interface IngestionResult {
  success: boolean;
  chunksAdded: number;
  summary: string;
  label: string;
  error?: string;
}

interface DocumentMetadata extends Record<string, string | number | undefined> {
  original_text: string;
  page_number?: number;
  doc_summary: string;
  doc_label: string;
  userId: string;
  chunk_index: number;
}

/**
 * RAG Ingestion Service for Smart Document Processing
 * Implements global summarization, smart chunking, and vector storage
 */
export class RAGIngestionService {
  private openaiClient: OpenAI;
  private pineconeClient: Pinecone | null = null;
  private chunkSize: number = 1000;
  private chunkOverlap: number = 100;

  constructor() {
    this.openaiClient = new OpenAI({
      apiKey: openaiApiKey || '',
    });

    if (pineconeApiKey) {
      this.pineconeClient = new Pinecone({
        apiKey: pineconeApiKey,
      });
    }
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate text to approximately 4k tokens
   */
  private truncateTo4kTokens(text: string): string {
    const maxChars = 4000 * 4; // ~4k tokens
    if (text.length <= maxChars) {
      return text;
    }
    return text.substring(0, maxChars);
  }

  /**
   * Step 1: Global Summarization
   * Generate a 2-line summary and category/label for the document
   */
  private async generateGlobalSummary(text: string): Promise<{ summary: string; label: string }> {
    try {
      const truncatedText = this.truncateTo4kTokens(text);
      
      const prompt = `Analyze the following document and provide:
1. A concise 2-line summary of the document's main content and purpose
2. A short category/label (e.g., "Financial Report", "Meeting Notes", "Technical Documentation", "Legal Document", "Research Paper")

Document:
${truncatedText}

Respond in the following JSON format:
{
  "summary": "Line 1 of summary. Line 2 of summary.",
  "label": "Category/Label"
}`;

      const completion = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a document analysis expert. Extract key information and categorize documents accurately.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content || '';
      const parsed = JSON.parse(response);

      return {
        summary: parsed.summary || 'No summary available',
        label: parsed.label || 'Uncategorized',
      };
    } catch (error: any) {
      console.error('Error generating global summary:', error);
      // Return defaults on error
      return {
        summary: 'Document content summary unavailable.',
        label: 'Uncategorized',
      };
    }
  }

  /**
   * Recursive character text splitter implementation
   * Splits text recursively by separators: ["\n\n", "\n", " ", ""]
   */
  private recursiveSplitText(text: string): string[] {
    const separators = ['\n\n', '\n', ' ', ''];
    const chunks: string[] = [];

    const splitRecursive = (text: string, separators: string[]): string[] => {
      if (text.length <= this.chunkSize) {
        return [text];
      }

      const separator = separators[0];
      const splits = separator ? text.split(separator) : [text];

      if (splits.length === 1 && separators.length > 1) {
        return splitRecursive(text, separators.slice(1));
      }

      const result: string[] = [];
      let currentChunk = '';

      for (const split of splits) {
        const testChunk = currentChunk + (currentChunk ? separator : '') + split;

        if (testChunk.length <= this.chunkSize) {
          currentChunk = testChunk;
        } else {
          if (currentChunk) {
            result.push(currentChunk);
            // Add overlap
            const overlapStart = Math.max(0, currentChunk.length - this.chunkOverlap);
            currentChunk = currentChunk.substring(overlapStart) + separator + split;
          } else {
            // Chunk is too large, force split
            if (separators.length > 1) {
              result.push(...splitRecursive(split, separators.slice(1)));
            } else {
              // Last resort: split by character
              for (let i = 0; i < split.length; i += this.chunkSize - this.chunkOverlap) {
                result.push(split.substring(i, i + this.chunkSize));
              }
            }
          }
        }
      }

      if (currentChunk) {
        result.push(currentChunk);
      }

      return result;
    };

    return splitRecursive(text, separators);
  }

  /**
   * Step 2: Smart Chunking with Context Prepending
   * Chunk the document and prepend summary and label to each chunk
   */
  private async smartChunking(
    text: string,
    summary: string,
    label: string
  ): Promise<string[]> {
    // Split into chunks using recursive character splitter
    const chunks = this.recursiveSplitText(text);

    // Prepend context to each chunk
    const enrichedChunks = chunks.map((chunk) => {
      return `[DOC_CTX: ${summary}]
[DOC_LABEL: ${label}]
---
${chunk}`;
    });

    return enrichedChunks;
  }

  /**
   * Step 3: Generate embeddings for chunks
   */
  private async generateEmbeddings(chunks: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];

      // Process in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const response = await this.openaiClient.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
        });

        const batchEmbeddings = response.data.map((item) => item.embedding);
        embeddings.push(...batchEmbeddings);
      }

      return embeddings;
    } catch (error: any) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Step 4: Upsert chunks to Pinecone
   */
  private async upsertToPinecone(
    chunks: string[],
    embeddings: number[][],
    metadata: Array<{
      original_text: string;
      page_number?: number;
      doc_summary: string;
      doc_label: string;
      userId: string;
    }>
  ): Promise<void> {
    if (!this.pineconeClient) {
      throw new Error('Pinecone client not initialized. Check PINECONE_API_KEY.');
    }

    if (!pineconeIndexName) {
      throw new Error('Pinecone index name not configured. Check PINECONE_INDEX_NAME.');
    }

    try {
      const index = this.pineconeClient.index(pineconeIndexName);

      // Prepare vectors for upsert
      const baseMetadata = metadata[0];
      const vectors = chunks.map((chunk, idx) => {
        const chunkMetadata: Record<string, string | number> = {
          original_text: chunk.split('---\n')[1] || chunk, // Extract original chunk text (after separator)
          doc_summary: baseMetadata.doc_summary || '',
          doc_label: baseMetadata.doc_label || '',
          userId: baseMetadata.userId || '',
          chunk_index: idx,
        };

        // Add page_number only if it exists
        if (baseMetadata.page_number !== undefined) {
          chunkMetadata.page_number = baseMetadata.page_number;
        }

        return {
          id: `${baseMetadata.userId || 'unknown'}_${Date.now()}_${idx}`, // Unique ID per chunk
          values: embeddings[idx],
          metadata: chunkMetadata,
        };
      });

      // Upsert in batches (Pinecone recommends batches of 100)
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
      }
    } catch (error: any) {
      console.error('Error upserting to Pinecone:', error);
      throw new Error(`Failed to upsert to Pinecone: ${error.message}`);
    }
  }

  /**
   * Main ingestion function
   * @param text - Raw document text or file buffer converted to text
   * @param userId - User ID for namespacing
   * @param pageNumber - Optional page number for metadata
   * @returns Ingestion result with chunks added and summary
   */
  async ingestDocument(
    text: string,
    userId: string,
    pageNumber?: number
  ): Promise<IngestionResult> {
    try {
      // Validate inputs
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          chunksAdded: 0,
          summary: '',
          label: '',
          error: 'Document text is empty',
        };
      }

      if (!userId) {
        return {
          success: false,
          chunksAdded: 0,
          summary: '',
          label: '',
          error: 'User ID is required',
        };
      }

      if (!openaiApiKey) {
        return {
          success: false,
          chunksAdded: 0,
          summary: '',
          label: '',
          error: 'OPENAI_API_KEY not configured',
        };
      }

      if (!pineconeApiKey || !pineconeIndexName) {
        return {
          success: false,
          chunksAdded: 0,
          summary: '',
          label: '',
          error: 'Pinecone not configured. Check PINECONE_API_KEY and PINECONE_INDEX_NAME',
        };
      }

      console.log(`📄 Starting RAG ingestion for user: ${userId}`);

      // Step 1: Global Summarization
      console.log('📝 Step 1: Generating global summary...');
      const { summary, label } = await this.generateGlobalSummary(text);
      console.log(`✅ Summary: ${summary.substring(0, 100)}...`);
      console.log(`✅ Label: ${label}`);

      // Step 2: Smart Chunking
      console.log('✂️  Step 2: Chunking document with context...');
      const chunks = await this.smartChunking(text, summary, label);
      console.log(`✅ Created ${chunks.length} chunks`);

      if (chunks.length === 0) {
        return {
          success: false,
          chunksAdded: 0,
          summary,
          label,
          error: 'No chunks created from document',
        };
      }

      // Step 3: Generate Embeddings
      console.log('🔢 Step 3: Generating embeddings...');
      const embeddings = await this.generateEmbeddings(chunks);
      console.log(`✅ Generated ${embeddings.length} embeddings`);

      // Step 4: Upsert to Pinecone
      console.log('💾 Step 4: Storing in Pinecone...');
      const metadata: Array<{
        original_text: string;
        page_number?: number;
        doc_summary: string;
        doc_label: string;
        userId: string;
      }> = [
        {
          original_text: text,
          page_number: pageNumber,
          doc_summary: summary,
          doc_label: label,
          userId,
        },
      ];

      await this.upsertToPinecone(chunks, embeddings, metadata);
      console.log(`✅ Successfully stored ${chunks.length} chunks in Pinecone`);

      return {
        success: true,
        chunksAdded: chunks.length,
        summary,
        label,
      };
    } catch (error: any) {
      console.error('Error in RAG ingestion:', error);
      return {
        success: false,
        chunksAdded: 0,
        summary: '',
        label: '',
        error: error.message || 'Unknown error during ingestion',
      };
    }
  }

  /**
   * Ingest from file buffer (converts buffer to text)
   * @param buffer - File buffer
   * @param userId - User ID for namespacing
   * @param pageNumber - Optional page number
   * @returns Ingestion result
   */
  async ingestFromBuffer(
    buffer: Buffer,
    userId: string,
    pageNumber?: number
  ): Promise<IngestionResult> {
    try {
      // Convert buffer to text (assuming UTF-8 encoding)
      // For PDFs or other formats, you'd need additional parsing libraries
      const text = buffer.toString('utf-8');
      return this.ingestDocument(text, userId, pageNumber);
    } catch (error: any) {
      return {
        success: false,
        chunksAdded: 0,
        summary: '',
        label: '',
        error: `Failed to convert buffer to text: ${error.message}`,
      };
    }
  }
}

export const ragIngestionService = new RAGIngestionService();
