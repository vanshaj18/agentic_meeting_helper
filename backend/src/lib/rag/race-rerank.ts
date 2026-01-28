/**
 * High-Speed Reranker Race
 * Races multiple fast API-based rerankers to guarantee sub-second latency (<1000ms)
 * The first one to return a valid result "wins" and determines the document order.
 */

import { logger } from '../../utils/logger';
import Groq from 'groq-sdk';
require('dotenv').config();

const JINA_API_KEY = process.env.JINA_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface RerankDocument {
  id: string;
  content: string;
  original_score: number;
  rank_meta?: {
    winner: 'jina' | 'baai-hf' | 'groq-llama';
    latency: number;
  };
}

interface RacerResult {
  sorted_indices: number[];
  winner: 'jina' | 'baai-hf' | 'groq-llama';
  latency: number;
}

/**
 * Racer A: Jina Rerank API
 * Fast, Commercial reranking service
 */
async function raceJina(
  query: string,
  documents: RerankDocument[]
): Promise<RacerResult> {
  const startTime = Date.now();

  if (!JINA_API_KEY) {
    throw new Error('JINA_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.jina.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'jina-reranker-v1-base-en',
        query: query,
        documents: documents.map((doc) => ({
          text: doc.content,
          id: doc.id,
        })),
        top_n: documents.length, // Return all documents in ranked order
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jina API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as {
      results?: Array<{ document?: { id: string }; id?: string; [key: string]: any }>;
      data?: Array<{ document?: { id: string }; id?: string; [key: string]: any }>;
      [key: string]: any;
    };
    const latency = Date.now() - startTime;

    // Jina returns results in ranked order with relevance scores
    // Extract indices based on the order returned
    const sorted_indices: number[] = [];
    
    if (data.results && Array.isArray(data.results)) {
      // Map Jina results back to original document indices
      const docIdToIndex = new Map(documents.map((doc, idx) => [doc.id, idx]));
      
      for (const result of data.results) {
        const originalIndex = docIdToIndex.get(result.document?.id || result.id);
        if (originalIndex !== undefined) {
          sorted_indices.push(originalIndex);
        }
      }
    } else if (data.data && Array.isArray(data.data)) {
      // Alternative response format
      const docIdToIndex = new Map(documents.map((doc, idx) => [doc.id, idx]));
      
      for (const result of data.data) {
        const originalIndex = docIdToIndex.get(result.document?.id || result.id);
        if (originalIndex !== undefined) {
          sorted_indices.push(originalIndex);
        }
      }
    }

    // If we couldn't map results, fall back to original order
    if (sorted_indices.length === 0) {
      logger.warn('Jina reranker: Could not map results, using original order', {
        component: 'RAG',
        responseKeys: Object.keys(data),
      });
      return {
        sorted_indices: documents.map((_, idx) => idx),
        winner: 'jina',
        latency,
      };
    }

    logger.debug('Jina reranker completed', {
      component: 'RAG',
      latency,
      resultCount: sorted_indices.length,
    });

    return {
      sorted_indices,
      winner: 'jina',
      latency,
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logger.error('Jina reranker failed', error, {
      component: 'RAG',
      latency,
    });
    throw error;
  }
}

/**
 * Racer B: Hugging Face Inference API
 * SOTA Open Source reranker (BAAI/bge-reranker-v2-m3)
 */
async function raceBAAI(
  query: string,
  documents: RerankDocument[]
): Promise<RacerResult> {
  const startTime = Date.now();

  if (!HF_TOKEN) {
    throw new Error('HF_TOKEN not configured');
  }

  try {
    // Prepare inputs for HF API
    const docContents = documents.map((doc) => doc.content);
    
    const response = await fetch(
      'https://api-inference.huggingface.co/models/BAAI/bge-reranker-v2-m3',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            source_sentence: query,
            sentences: docContents,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API error: ${response.status} - ${errorText}`);
    }

    const scores = await response.json();
    const latency = Date.now() - startTime;

    // HF API returns a flat list of scores
    // Map scores to original indices and sort by score (descending)
    if (!Array.isArray(scores)) {
      throw new Error('HF API returned invalid format: expected array of scores');
    }

    if (scores.length !== documents.length) {
      logger.warn('HF reranker: Score count mismatch', {
        component: 'RAG',
        scoresLength: scores.length,
        documentsLength: documents.length,
      });
    }

    // Create array of [index, score] pairs
    const indexedScores = scores
      .slice(0, documents.length)
      .map((score: number, idx: number) => [idx, score] as [number, number]);

    // Sort by score descending
    indexedScores.sort((a, b) => b[1] - a[1]);

    // Extract sorted indices
    const sorted_indices = indexedScores.map(([idx]) => idx);

    logger.debug('BAAI reranker completed', {
      component: 'RAG',
      latency,
      resultCount: sorted_indices.length,
    });

    return {
      sorted_indices,
      winner: 'baai-hf',
      latency,
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logger.error('BAAI reranker failed', error, {
      component: 'RAG',
      latency,
    });
    throw error;
  }
}

/**
 * Racer C: Groq Llama Listwise Reranker
 * Fast LLM-based listwise ranking using llama3-8b-8192
 */
async function raceGroqLlama(
  query: string,
  documents: RerankDocument[]
): Promise<RacerResult> {
  const startTime = Date.now();

  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    // Initialize Groq client
    const groq = new Groq({
      apiKey: GROQ_API_KEY,
    });

    // Map documents to numbered format: [1] Content... \n [2] Content...
    const numberedDocs = documents
      .map((doc, idx) => `[${idx + 1}] ${doc.content}`)
      .join('\n\n');

    // Construct prompt
    const systemMessage = 'You are a high-speed ranking assistant. Output ONLY the sorted list of IDs in order of relevance (most relevant first). Format: [1] > [2] > [3] or just: 1 > 2 > 3';
    
    const userMessage = `Rank these passages by relevance to: "${query}"

${numberedDocs}

Output the ranked order of IDs (most relevant first). Format: [1] > [2] > [3] or 1 > 2 > 3`;

    // Inference call
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      model: 'llama3-8b-8192', // Fastest inference model
      temperature: 0,
      max_tokens: 100, // We only need the ID string
    });

    const content = completion.choices[0]?.message?.content;
    const latency = Date.now() - startTime;

    if (!content) {
      throw new Error('Groq API returned empty content');
    }

    // Parse the output to extract sorted indices
    // Try multiple regex patterns to handle different formats
    let sorted_indices: number[] = [];

    // Pattern 1: [1] > [2] > [3]
    const bracketPattern = /\[(\d+)\]/g;
    const bracketMatches = Array.from(content.matchAll(bracketPattern));
    if (bracketMatches.length > 0) {
      sorted_indices = bracketMatches.map((match) => parseInt(match[1]) - 1); // Convert to 0-indexed
    } else {
      // Pattern 2: 1 > 2 > 3 or 1, 2, 3
      const numberPattern = /\d+/g;
      const numberMatches = content.match(numberPattern);
      if (numberMatches) {
        sorted_indices = numberMatches.map((num) => parseInt(num) - 1); // Convert to 0-indexed
      }
    }

    // Validation: Ensure parsed IDs correspond to valid indices
    const validIndices = sorted_indices.filter(
      (idx) => idx >= 0 && idx < documents.length
    );

    // Remove duplicates while preserving order
    const uniqueIndices: number[] = [];
    const seen = new Set<number>();
    for (const idx of validIndices) {
      if (!seen.has(idx)) {
        uniqueIndices.push(idx);
        seen.add(idx);
      }
    }

    // If we don't have enough valid indices, fill with remaining indices
    if (uniqueIndices.length < documents.length) {
      const remainingIndices = documents
        .map((_, idx) => idx)
        .filter((idx) => !seen.has(idx));
      uniqueIndices.push(...remainingIndices);
    }

    // If parsing failed completely, throw error to fall back to other racers
    if (uniqueIndices.length === 0) {
      throw new Error(
        `Groq reranker: Failed to parse valid indices from response: "${content}"`
      );
    }

    logger.debug('Groq Llama reranker completed', {
      component: 'RAG',
      latency,
      resultCount: uniqueIndices.length,
      parsedContent: content.substring(0, 100),
    });

    return {
      sorted_indices: uniqueIndices,
      winner: 'groq-llama',
      latency,
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logger.error('Groq Llama reranker failed', error, {
      component: 'RAG',
      latency,
    });
    throw error;
  }
}

/**
 * Timeout promise that rejects after specified milliseconds
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Reranker race timeout after ${ms}ms`));
    }, ms);
  });
}

/**
 * High-Speed Reranker Race
 * Races multiple rerankers (Jina, BAAI/HF, Groq Llama), returns the first valid result
 * 
 * @param query - The search query
 * @param documents - Array of documents to rerank
 * @returns Reordered documents array with rank_meta on top result
 */
export async function raceRerank(
  query: string,
  documents: RerankDocument[]
): Promise<RerankDocument[]> {
  if (!documents || documents.length === 0) {
    logger.warn('Race rerank: No documents to rerank', { component: 'RAG' });
    return documents;
  }

  if (documents.length === 1) {
    // No need to rerank a single document
    return documents;
  }

  logger.rag('Starting reranker race', {
    query: query.substring(0, 100),
    documentCount: documents.length,
  });

  // Check which APIs are configured
  const jinaConfigured = !!JINA_API_KEY;
  const baaiConfigured = !!HF_TOKEN;
  const groqConfigured = !!GROQ_API_KEY;

  if (!jinaConfigured && !baaiConfigured && !groqConfigured) {
    logger.warn('Race rerank: No rerankers configured, returning original order', {
      component: 'RAG',
    });
    return documents;
  }

  // Build array of racers (only include configured ones)
  const racers: Promise<RacerResult>[] = [];

  if (jinaConfigured) {
    racers.push(raceJina(query, documents));
  }

  if (baaiConfigured) {
    racers.push(raceBAAI(query, documents));
  }

  if (groqConfigured) {
    racers.push(raceGroqLlama(query, documents));
  }

  if (racers.length === 0) {
    logger.warn('Race rerank: No racers available', { component: 'RAG' });
    return documents;
  }

  // Add timeout promise (950ms to give 50ms buffer before 1s SLA)
  const timeoutPromise = createTimeoutPromise(950);
  const raceStartTime = Date.now();

  try {
    // Race all racers and timeout
    const winner = await Promise.race([...racers, timeoutPromise]);

    const totalLatency = Date.now() - raceStartTime;

    logger.rag('Reranker race completed', {
      winner: winner.winner,
      latency: winner.latency,
      totalLatency,
      documentCount: documents.length,
    });

    // Reorder documents based on winner's sorted_indices
    const reorderedDocs = winner.sorted_indices.map((idx) => documents[idx]);

    // Add rank_meta to the top result
    if (reorderedDocs.length > 0) {
      reorderedDocs[0].rank_meta = {
        winner: winner.winner,
        latency: winner.latency,
      };
    }

    return reorderedDocs;
  } catch (error: any) {
    const totalLatency = Date.now() - raceStartTime;
    
    logger.ragError('Reranker race failed or timed out', error, {
      totalLatency,
      documentCount: documents.length,
    });

    // Fallback: return documents in original order
    logger.warn('Race rerank: Falling back to original order', {
      component: 'RAG',
    });
    return documents;
  }
}

/**
 * Check if reranker race is available (at least one API configured)
 */
export function isRerankerRaceAvailable(): boolean {
  return !!(JINA_API_KEY || HF_TOKEN || GROQ_API_KEY);
}
