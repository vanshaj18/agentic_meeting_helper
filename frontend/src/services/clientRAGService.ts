/**
 * Client-Side RAG Service
 * Handles ingestion and retrieval for small files (< 5MB) using IndexedDB
 * 
 * New Workflow:
 * 1. Page-by-page PDF extraction using pdfjs-dist
 * 2. Smart summarization with Groq (skip < 500 chars, batch 3 pages) in the server
 * 3. Local embedding using @xenova/transformers
 * 4. Store in IndexedDB with LocalDoc schema
 */

import { indexedDBService, LocalDoc } from './indexedDBService';
import { logger } from '../utils/logger';
import * as pdfjsLib from 'pdfjs-dist';
import { pipeline } from '@xenova/transformers';
import { ragAPI } from './api';

// Configure pdfjs-dist worker
// Use unpkg to auto-match the installed version and target the correct .mjs build
if (typeof window !== 'undefined' && 'Worker' in window) {
  // Use unpkg to auto-match the installed version and target the correct .mjs build
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const FILE_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB in bytes

interface ChunkMetadata {
  doc_summary: string;
  doc_label: string;
  chunk_index: number;
  original_text: string;
  page_number?: number;
}

/**
 * Recursive text splitter (client-side implementation)
 */
function recursiveSplitText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 100
): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  const separators = ['\n\n', '\n', '. ', ' ', ''];
  const result: string[] = [];

  const splitRecursive = (remaining: string): string[] => {
    if (remaining.length <= chunkSize) {
      return [remaining];
    }

    let chunk = '';
    let foundSeparator = false;

    for (const separator of separators) {
      const index = remaining.lastIndexOf(separator, chunkSize);
      if (index > chunkSize * 0.5) {
        chunk = remaining.substring(0, index + separator.length);
        foundSeparator = true;
        break;
      }
    }

    if (!foundSeparator) {
      chunk = remaining.substring(0, chunkSize);
    }

    result.push(chunk.trim());

    const nextStart = Math.max(0, chunk.length - overlap);
    const remainingText = remaining.substring(nextStart);

    if (remainingText.length > 0) {
      return [...result, ...splitRecursive(remainingText)];
    }

    return result;
  };

  return splitRecursive(text);
}

/**
 * Generate embeddings using Pinecone Inference API (client-side)
 */
// async function generateEmbeddingsClient(
//   chunks: string[],
//   pineconeApiKey: string,
//   model: string = 'llama-text-embed-v2',
//   dimensions: number = 1024
// ): Promise<number[][]> {
//   const embeddings: number[][] = [];
//   const batchSize = 10;

//   for (let i = 0; i < chunks.length; i += batchSize) {
//     const batch = chunks.slice(i, i + batchSize);

//     try {
//       const response = await fetch('https://api.pinecone.io/inference/generate_embeddings', {
//         method: 'POST',
//         headers: {
//           'Api-Key': pineconeApiKey,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           model,
//           inputs: batch,
//           parameters: {
//             input_type: 'passage',
//             dimensions,
//           },
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`Pinecone API error: ${response.status}`);
//       }

//       const data = await response.json() as any;
//       if (data.embeddings && Array.isArray(data.embeddings)) {
//         embeddings.push(...data.embeddings);
//       } else if (data.data && Array.isArray(data.data)) {
//         embeddings.push(...data.data);
//       } else {
//         throw new Error('Unexpected response format');
//       }
//     } catch (error: any) {
//       logger.error('Failed to generate embeddings client-side', error, {
//         component: 'RAG',
//       });
//       // Return empty embeddings if generation fails
//       embeddings.push(...batch.map(() => []));
//     }
//   }

//   return embeddings;
// }

/**
 * Generate global summary using OpenAI (client-side)
 */
// async function generateGlobalSummaryClient(
//   text: string,
//   openaiApiKey: string
// ): Promise<{ summary: string; label: string }> {
//   const truncatedText = text.substring(0, 16000); // ~4k tokens

//   const prompt = `Analyze the following document and provide:
// 1. A concise 2-line summary of the document's main content and purpose
// 2. A short category/label (e.g., "Financial Report", "Meeting Notes", "Technical Documentation", "Legal Document", "Research Paper")

// Document:
// ${truncatedText}

// Respond in the following JSON format:
// {
//   "summary": "Line 1 of summary. Line 2 of summary.",
//   "label": "Category/Label"
// }`;

//   try {
//     const response = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${openaiApiKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o-mini',
//         messages: [
//           {
//             role: 'user',
//             content: prompt,
//           },
//         ],
//         temperature: 0.3,
//         response_format: { type: 'json_object' },
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`OpenAI API error: ${response.status}`);
//     }

//     const data = await response.json();
//     const content = data.choices[0]?.message?.content || '{}';
//     const parsed = JSON.parse(content);

//     return {
//       summary: parsed.summary || '',
//       label: parsed.label || '',
//     };
//   } catch (error: any) {
//     logger.error('Failed to generate summary client-side', error, {
//       component: 'RAG',
//     });
//     return {
//       summary: 'Document summary unavailable',
//       label: 'Uncategorized',
//     };
//   }
// }

/**
 * Step 1: Extract text page by page from PDF
 */
async function extractPagesFromPDF(file: File): Promise<Array<{ page: number; content: string }>> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: Array<{ page: number; content: string }> = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push({ page: pageNum, content: pageText });
  }

  return pages;
}

/**
 * Generate page summary with citations using server-side API
 * @param text - Page text content
 * @param pageNumber - Page number for logging
 * @param isFirstPage - Whether this is the first page (for APA citation generation)
 * @returns Structured response with summary, topic_tag, and optional apa_citation
 */
async function generatePageSummary(
  text: string,
  pageNumber: number,
  isFirstPage: boolean = false
): Promise<{ summary: string | null; topic_tag: string | null; apa_citation: string | null }> {
  // Skip summarization for short pages (< 500 chars)
  if (text.length < 500) {
    return {
      summary: null,
      topic_tag: null,
      apa_citation: null,
    };
  }

  try {
    const result = await ragAPI.summarizePage(text, pageNumber, isFirstPage);
    return {
      summary: result.summary || null,
      topic_tag: result.topic_tag || null,
      apa_citation: result.apa_citation || null,
    };
  } catch (error: any) {
    logger.error('Failed to generate page summary', error, {
      component: 'RAG',
      page: pageNumber,
      errorMessage: error.message,
    });
    return {
      summary: null,
      topic_tag: null,
      apa_citation: null,
    };
  }
}

/**
 * Race a promise with a timeout
 * @param promise - The promise to race
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutValue - Value to return on timeout
 * @returns Promise that resolves to the result or timeoutValue
 */
async function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutValue: T
): Promise<T> {
  const timeoutPromise = new Promise<T>((resolve) => {
    setTimeout(() => resolve(timeoutValue), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Step 3: Generate local embeddings using @xenova/transformers
 */
let embeddingPipeline: any = null;

async function generateLocalEmbeddings(
  texts: string[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<number[][]> {
  try {
    // Initialize pipeline if not already done
    if (!embeddingPipeline) {
      if (onProgress) {
        onProgress(0, texts.length, 'Loading embedding model...');
      }
      const pipelineResult = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      
      // Check that pipeline is valid and callable
      if (!pipelineResult) {
        throw new Error('Pipeline initialization returned null or undefined');
      }
      
      // Check if it's a function (callable pipeline)
      if (typeof pipelineResult !== 'function') {
        throw new Error(`Pipeline initialization returned invalid type: ${typeof pipelineResult}. Expected a function.`);
      }
      
      embeddingPipeline = pipelineResult;
    }

    // Ensure pipeline is initialized and callable
    if (!embeddingPipeline) {
      throw new Error('Failed to initialize embedding pipeline');
    }
    
    if (typeof embeddingPipeline !== 'function') {
      throw new Error(`Embedding pipeline is not callable. Type: ${typeof embeddingPipeline}`);
    }

    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i++) {
      if (onProgress) {
        onProgress(i, texts.length, `Generating embedding ${i + 1}/${texts.length}...`);
      }

      const result = await embeddingPipeline(texts[i], { pooling: 'mean', normalize: true });
      
      // Validate result structure
      if (!result || !result.data) {
        logger.error('Invalid embedding result', undefined, {
          component: 'RAG',
          textIndex: i,
          resultType: typeof result,
        });
        embeddings.push([]);
        continue;
      }
      
      // Convert tensor to array - result.data is a TypedArray, convert to number[]
      const embedding = Array.from(result.data as ArrayLike<number>);
      embeddings.push(embedding);
    }

    return embeddings;
  } catch (error: any) {
    logger.error('Failed to generate local embeddings', error, {
      component: 'RAG',
      errorMessage: error.message,
      errorType: typeof error,
    });
    // Return empty embeddings if generation fails
    return texts.map(() => []);
  }
}

/**
 * Check if file should use IndexedDB (file size < 5MB)
 */
export function shouldUseIndexedDB(file: File): boolean {
  return file.size < FILE_SIZE_THRESHOLD;
}

/**
 * Ingest document client-side with parallel ingestion pipeline
 * @param file - PDF file object
 * @param onProgress - Optional progress callback (current, total, message)
 * @param summaryTimeoutMs - Timeout for summary generation (default: 200ms)
 */
export async function ingestDocumentClient(
  documentId: number,
  userId: string,
  file: File,
  documentTitle: string,
  onProgress?: (current: number, total: number, message: string) => void,
  summaryTimeoutMs: number = 200
): Promise<{ success: boolean; chunksAdded: number; summary: string; label: string; error?: string }> {
  try {
    logger.rag('Starting client-side ingestion (parallel pipeline)', {
      documentId,
      fileSize: file.size,
      fileName: file.name,
      summaryTimeoutMs,
    });

    // Step 1: Extract text page by page
    if (onProgress) {
      onProgress(0, 100, 'Extracting text from PDF...');
    }
    const pages = await extractPagesFromPDF(file);
    logger.rag('Extracted pages from PDF', {
      documentId,
      pageCount: pages.length,
    });

    if (pages.length === 0) {
      return {
        success: false,
        chunksAdded: 0,
        summary: '',
        label: '',
        error: 'No pages extracted from PDF',
      };
    }

    // Step 2: Parallel Processing Pipeline
    // For each page: Run summarization (server) and chunking (client) in parallel
    if (onProgress) {
      onProgress(10, 100, 'Processing pages in parallel...');
    }

    const processedChunks: Array<{
      page: number;
      chunks: string[];
      summary: string | null;
      topic_tag: string | null;
      apa_citation: string | null;
      content: string;
    }> = [];

    let documentApaCitation: string | null = null;

    const totalPages = pages.length;
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const isFirstPage = i === 0;
      
      if (onProgress) {
        const progress = 10 + Math.floor((i / totalPages) * 40); // 10-50%
        onProgress(progress, 100, `Processing page ${page.page}/${totalPages}...`);
      }

      // Step 2A & 2B: Start both tasks in parallel
      const summaryPromise = generatePageSummary(page.content, page.page, isFirstPage);
      const chunksPromise = Promise.resolve(recursiveSplitText(page.content));

      // Step 2C: Race the summary with timeout
      const summaryResult = await raceWithTimeout(
        summaryPromise,
        summaryTimeoutMs,
        { summary: null, topic_tag: null, apa_citation: null } as { summary: string | null; topic_tag: string | null; apa_citation: string | null }
      );

      // Step 2D: Get chunks (already resolved)
      const chunks = await chunksPromise;

      // Step 2E: Store APA citation from first page
      if (isFirstPage && summaryResult.apa_citation) {
        documentApaCitation = summaryResult.apa_citation;
      }

      // Step 2F: Prepend summary to chunks if available
      const finalChunks = summaryResult.summary
        ? chunks.map((chunk) => `Context: ${summaryResult.summary}\n\nContent: ${chunk}`)
        : chunks;

      processedChunks.push({
        page: page.page,
        chunks: finalChunks,
        summary: summaryResult.summary || null,
        topic_tag: summaryResult.topic_tag || null,
        apa_citation: summaryResult.apa_citation || null,
        content: page.content,
      });

      logger.rag('Page processed', {
        documentId,
        page: page.page,
        chunksCount: finalChunks.length,
        hasSummary: summaryResult.summary !== null,
        hasTopicTag: summaryResult.topic_tag !== null,
        hasCitation: summaryResult.apa_citation !== null,
      });
    }

    // Step 3: Generate embeddings for all chunks
    if (onProgress) {
      onProgress(50, 100, 'Generating embeddings...');
    }

    const allChunks = processedChunks.flatMap((pc) => pc.chunks);
    const embeddings = await generateLocalEmbeddings(allChunks, (current, total, message) => {
      if (onProgress) {
        const progress = 50 + Math.floor((current / total) * 40); // 50-90%
        onProgress(progress, 100, message);
      }
    });

    // Step 4: Store in IndexedDB
    if (onProgress) {
      onProgress(90, 100, 'Storing in IndexedDB...');
    }

    // Build LocalDoc structure with APA citation
    const docId = `${file.name}_${Date.now()}`;
    const localDoc: LocalDoc = {
      id: docId,
      name: documentTitle,
      apaCitation: documentApaCitation || file.name, // Fallback to file name if no citation
      pages: processedChunks.map((pc) => ({
        pageNum: pc.page,
        summary: pc.summary || pc.content.substring(0, 200),
        content: pc.content,
        embedding: [], // Will be stored per-chunk below
      })),
      timestamp: Date.now(),
    };

    await indexedDBService.storeLocalDoc(localDoc);

    // Store chunks with citation tags
    let chunkIndex = 0;
    const chunksData = processedChunks.flatMap((pc) => {
      const pageChunks = pc.chunks.map((chunk, idx) => ({
        content: chunk,
        embedding: embeddings[chunkIndex + idx] || undefined,
        metadata: {
          doc_summary: pc.summary || pc.content.substring(0, 200),
          doc_label: 'PDF Document',
          chunk_index: chunkIndex + idx,
          original_text: pc.content,
          page_number: pc.page,
          citation_tag: pc.topic_tag || undefined, // Store topic tag as citation_tag
        },
      }));
      chunkIndex += pageChunks.length;
      return pageChunks;
    });

    await indexedDBService.storeChunks(
      documentId,
      userId,
      chunksData,
      {
        title: documentTitle,
        label: 'PDF Document',
        summary: processedChunks
          .map((pc) => pc.summary || pc.content.substring(0, 200))
          .join(' ')
          .substring(0, 500),
        apaCitation: documentApaCitation || file.name, // Store APA citation in document metadata
      }
    );

    if (onProgress) {
      onProgress(100, 100, 'Complete!');
    }

    const totalChunks = chunksData.length;
    logger.rag('Client-side ingestion completed', {
      documentId,
      pagesProcessed: processedChunks.length,
      chunksAdded: totalChunks,
      summariesGenerated: processedChunks.filter((pc) => pc.summary !== null).length,
    });

    return {
      success: true,
      chunksAdded: totalChunks,
      summary: processedChunks
        .map((pc) => pc.summary || pc.content.substring(0, 200))
        .join(' ')
        .substring(0, 500),
      label: 'PDF Document',
    };
  } catch (error: any) {
    logger.ragError('Client-side ingestion failed', error, { documentId });
    return {
      success: false,
      chunksAdded: 0,
      summary: '',
      label: '',
      error: error.message || 'Failed to ingest document',
    };
  }
}

/**
 * Search chunks from IndexedDB
 */
export async function searchChunksClient(
  query: string,
  userId: string,
  documentId?: number,
  topK: number = 5
): Promise<Array<{
  id: string;
  text: string;
  score?: number;
  metadata?: Record<string, any>;
  source: 'vector' | 'graph';
}>> {
  try {
    const chunks = await indexedDBService.searchChunks(query, userId, documentId, topK);
    
    return chunks.map((chunk) => ({
      id: chunk.id,
      text: chunk.content,
      score: 1, // Simple text search score
      metadata: {
        ...chunk.metadata,
        source: 'indexeddb',
      },
      source: 'vector' as const,
    }));
  } catch (error: any) {
    logger.ragError('Client-side chunk search failed', error, { userId, documentId });
    return [];
  }
}
