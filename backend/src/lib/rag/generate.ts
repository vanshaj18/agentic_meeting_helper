/**
 * RAG Generation Step
 * Takes reranked documents and generates final answer with citations using Groq
 */

import Groq from 'groq-sdk';
import { logger } from '../../utils/logger';
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface RerankedDocument {
  id: string;
  content: string;
  original_score?: number;
  metadata?: {
    source?: 'vector' | 'graph';
    doc_summary?: string;
    doc_label?: string;
    headId?: string;
    targetId?: string;
    pathLength?: number;
    rank_meta?: {
      winner: 'jina' | 'baai-hf' | 'groq-llama';
      latency: number;
    };
    [key: string]: any;
  };
}

interface GenerationResult {
  answer: string;
  citations: string[];
}

/**
 * Format documents into context block with citations
 */
function formatContextBlock(documents: RerankedDocument[]): string {
  const contextBlocks: string[] = [];

  for (const doc of documents) {
    const sourceId = doc.id || 'unknown';
    const sourceType = doc.metadata?.source || 'unknown';
    
    // Determine origin strategy
    const originStrategy = doc.metadata?.source === 'graph' 
      ? 'Graph-Node' 
      : 'Vector-Chunk';

    // Build context block
    const blockParts: string[] = [];
    blockParts.push(`[Source: ${sourceId}]`);
    blockParts.push(`(Origin: ${originStrategy})`);

    // Add context based on type
    if (doc.metadata?.source === 'graph') {
      // Graph Node: The entire content is the path context
      // Format: "Document: Title > Section: Name > Content: Text"
      // or: "Document: Title > label1: content1 > label2: content2"
      if (doc.content.includes('Document:')) {
        blockParts.push(`**Path Context:** ${doc.content}`);
      } else {
        // Fallback: use content as-is
        blockParts.push(`**Path Context:** ${doc.content}`);
      }
    } else {
      // Vector Chunk: Use doc summary if available
      if (doc.metadata?.doc_summary) {
        blockParts.push(`**Doc Summary:** ${doc.metadata.doc_summary}`);
      }
      if (doc.metadata?.doc_label) {
        blockParts.push(`**Doc Label:** ${doc.metadata.doc_label}`);
      }
      
      // For vector chunks, extract content if it has the DOC_CTX format
      // Format: "[DOC_CTX: Summary]\n[DOC_LABEL: Label]\n---\n{Actual Chunk Text}"
      let content = doc.content;
      if (doc.content.includes('[DOC_CTX:') && doc.content.includes('---')) {
        // Extract content after the separator
        const parts = doc.content.split('---');
        if (parts.length > 1) {
          content = parts.slice(1).join('---').trim();
        }
      }
      blockParts.push(`**Content:** ${content}`);
    }

    contextBlocks.push(blockParts.join('\n'));
  }

  return contextBlocks.join('\n\n---\n\n');
}

/**
 * Extract citations from generated text
 * Looks for [Source: X] patterns in the answer
 */
function extractCitations(answer: string): string[] {
  const citationPattern = /\[Source:\s*([^\]]+)\]/g;
  const citations: string[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = citationPattern.exec(answer)) !== null) {
    const sourceId = match[1].trim();
    if (!seen.has(sourceId)) {
      citations.push(sourceId);
      seen.add(sourceId);
    }
  }

  return citations;
}

/**
 * Generate final answer from reranked documents using Groq
 * 
 * @param query - The user's question
 * @param documents - Array of reranked documents (top-k, e.g., 5)
 * @returns Generation result with answer and citations
 */
export async function generateAnswer(
  query: string,
  documents: RerankedDocument[],
  topK: number = 5
): Promise<GenerationResult> {
  if (!GROQ_API_KEY) {
    logger.ragError('GROQ_API_KEY not configured for generation', undefined, {
      component: 'RAG',
    });
    throw new Error('GROQ_API_KEY not configured. Please set it in your .env file.');
  }

  if (!documents || documents.length === 0) {
    logger.warn('Generation: No documents provided', { component: 'RAG' });
    return {
      answer: 'I do not have enough context to answer this question.',
      citations: [],
    };
  }

  // Take top-k documents
  const topDocuments = documents.slice(0, topK);
  
  logger.rag('Starting RAG generation', {
    query: query.substring(0, 100),
    documentCount: topDocuments.length,
    topK,
  });

  try {
    // Initialize Groq client
    const groq = new Groq({
      apiKey: GROQ_API_KEY,
    });

    // Format context block
    const formattedContext = formatContextBlock(topDocuments);

    // Construct system prompt
    const systemPrompt = `You are an expert AI assistant relying ONLY on the provided context.

**Citation Rule:** Every time you state a fact, you MUST cite the source ID immediately at the end of the sentence, like this: 'Revenue grew by 5% [Source: doc_123].' Do not make up sources. Only cite sources that are actually provided in the context.

**Constraints:**
- If the answer is not in the context, state that you do not know.
- Base your answer strictly on the provided context.
- Always cite your sources using the [Source: X] format.
- Be concise but comprehensive.`;

    // Construct user message
    const userMessage = `Question: ${query}

Context:
${formattedContext}

Answer the question based on the provided context. Cite sources using [Source: X] format.`;

    const startTime = Date.now();

    // Inference call
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      model: 'llama-3.3-70b-versatile', // High quality reasoning, fast inference
      temperature: 0.3, // Low temp for factual accuracy
      max_tokens: 1024,
    });

    const latency = Date.now() - startTime;
    const answer = completion.choices[0]?.message?.content || '';

    if (!answer) {
      logger.ragError('Groq returned empty answer', undefined, {
        component: 'RAG',
        latency,
      });
      return {
        answer: 'I encountered an error generating the answer.',
        citations: [],
      };
    }

    // Extract citations from the answer
    const citations = extractCitations(answer);

    logger.rag('RAG generation completed', {
      answerLength: answer.length,
      citationCount: citations.length,
      citations,
      latency,
    });

    return {
      answer,
      citations,
    };
  } catch (error: any) {
    logger.ragError('RAG generation failed', error, {
      component: 'RAG',
      query: query.substring(0, 100),
    });
    throw error;
  }
}

/**
 * Check if RAG generation is available (Groq API configured)
 */
export function isGenerationAvailable(): boolean {
  return !!GROQ_API_KEY;
}
