import express from 'express';
import multer from 'multer';
import { RAGIngestionService } from '../lib/rag/ingest';
import { logger } from '../utils/logger';
import { getDocumentById, updateDocument } from '../services/documentService';
import Groq from 'groq-sdk';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const ragIngestionService = new RAGIngestionService();

const FILE_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB

/**
 * Client-side ingestion endpoint (for files < 5MB stored in IndexedDB)
 * POST /rag/ingest-client/:documentId
 * Returns ingestion result with chunks data for client-side IndexedDB storage
 */
router.post('/ingest-client/:documentId', upload.single('file'), async (req, res) => {
  const documentId = parseInt(req.params.documentId);
  const userId = req.body.userId || 'default-user';
  const documentTitle = req.body.documentTitle || '';

  logger.rag('Client-side RAG ingestion request', { documentId, userId });

  try {
    const document = getDocumentById(documentId);
    if (!document) {
      logger.ragError('Document not found for client-side ingestion', undefined, { documentId });
      return res.status(404).json({ error: 'Document not found' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Check file size - should be < 5MB for client-side storage
    if (file.size >= FILE_SIZE_THRESHOLD) {
      logger.warn('File too large for client-side storage, redirecting to server-side', {
        component: 'RAG',
        fileSize: file.size,
      });
      // Redirect to server-side ingestion
      return res.redirect(`/api/rag/ingest/${documentId}`);
    }

    // Process file for client-side storage
    const text = file.buffer.toString('utf-8');
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'File appears to be binary, PDF parsing not fully implemented' 
      });
    }

    // Generate chunks for IndexedDB storage (don't store in Pinecone)
    const result = await ragIngestionService.generateChunksForIndexedDB(text, userId);

    if (!result.success) {
      logger.ragError('Client-side ingestion failed', undefined, { documentId, error: result.error });
      return res.status(500).json({ 
        error: result.error || 'Failed to generate chunks',
        result 
      });
    }

    // Update document with generated label if not provided
    if (result.label && !document.label) {
      updateDocument(documentId, { label: result.label });
    }

    logger.rag('Client-side ingestion completed', {
      documentId,
      chunksAdded: result.chunks.length,
      label: result.label,
    });

    res.json({
      success: true,
      chunksAdded: result.chunks.length,
      summary: result.summary,
      label: result.label,
      documentId,
      storageType: 'indexeddb',
      chunks: result.chunks, // Return chunks for IndexedDB storage
    });
  } catch (error: any) {
    logger.ragError('Client-side ingestion exception', error, { documentId });
    res.status(500).json({ 
      error: error.message || 'Failed to ingest document' 
    });
  }
});

/**
 * Ingest document for RAG (server-side Pinecone storage for files >= 5MB)
 * POST /rag/ingest/:documentId
 * Body: FormData with file (if not already uploaded)
 */
router.post('/ingest/:documentId', upload.single('file'), async (req, res) => {
  const documentId = parseInt(req.params.documentId);
  const userId = req.body.userId || 'default-user'; // TODO: Get from auth

  logger.rag('Server-side RAG ingestion request', { documentId, userId });

  try {
    const document = getDocumentById(documentId);
    if (!document) {
      logger.ragError('Document not found for ingestion', undefined, { documentId });
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get file from request or use existing file
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Check file size - if < 5MB, suggest client-side storage
    if (file.size < FILE_SIZE_THRESHOLD) {
      logger.rag('File is small, recommending client-side storage', {
        documentId,
        fileSize: file.size,
      });
      // Still process, but log recommendation
    }

    // Convert file buffer to text (assuming PDF - in production, use PDF parser)
    // For now, we'll use a simple text extraction
    const text = file.buffer.toString('utf-8');
    
    // If UTF-8 doesn't work (binary PDF), we'd need a PDF parser
    // For now, we'll assume text-based PDFs or handle binary gracefully
    if (!text || text.trim().length === 0) {
      logger.warn('File appears to be binary, PDF parsing not implemented', {
        component: 'RAG',
        documentId,
      });
      // In production, use pdf-parse or similar library
      return res.status(400).json({ 
        error: 'PDF parsing not fully implemented. Please ensure file is text-based or implement PDF parser.' 
      });
    }

    // Start ingestion
    logger.rag('Starting document ingestion', { documentId, textLength: text.length });
    const result = await ragIngestionService.ingestDocument(text, userId);

    if (!result.success) {
      logger.ragError('Ingestion failed', undefined, { documentId, error: result.error });
      return res.status(500).json({ 
        error: result.error || 'Failed to ingest document',
        result 
      });
    }

    // Update document with generated label if not provided
    if (result.label && !document.label) {
      updateDocument(documentId, { label: result.label });
    }

    logger.rag('Document ingestion completed', {
      documentId,
      chunksAdded: result.chunksAdded,
      label: result.label,
    });

    res.json({
      success: true,
      chunksAdded: result.chunksAdded,
      summary: result.summary,
      label: result.label,
      documentId,
    });
  } catch (error: any) {
    logger.ragError('RAG ingestion exception', error, { documentId });
    res.status(500).json({ 
      error: error.message || 'Failed to ingest document' 
    });
  }
});

/**
 * Generate page summary with citations using Groq (Server-side)
 * POST /rag/summarize-page
 * Body: { text: string, pageNumber: number, isFirstPage?: boolean }
 * Returns: { summary: string | null, topic_tag: string | null, apa_citation: string | null }
 */
router.post('/summarize-page', async (req, res) => {
  const { text, pageNumber, isFirstPage } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Skip summarization for short pages (< 500 chars)
  if (text.length < 500) {
    return res.json({ 
      summary: undefined, 
      topic_tag: undefined, 
      apa_citation: undefined 
    });
  }

  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      logger.ragError('Groq API key not configured', undefined, { pageNumber });
      return res.status(503).json({ 
        error: 'Groq API key not configured',
        summary: undefined,
        topic_tag: undefined,
        apa_citation: undefined
      });
    }

    const groq = new Groq({
      apiKey: groqApiKey,
    });

    // Build prompt based on whether it's the first page
    let prompt = `Analyze this text.

Page ${pageNumber || 'Unknown'}:
${text.substring(0, 4000)}

Please provide:
1. A 1-sentence summary capturing key dates, entities, and decisions.
2. A short, specific topic tag (max 10 words) describing the key insight (e.g., 'Q3 Revenue Figures', 'Safety Protocols', 'Introduction').`;

    if (isFirstPage) {
      prompt += `\n3. Generate a hypothetical APA-style citation for this document based on the title/content found. Format: Author. (Year). *Title*. Publisher.`;
    }

    prompt += `\n\nRespond with a valid JSON object in this exact format:
{
  "summary": "your 1-sentence summary here",
  "topic_tag": "your topic tag here",
  ${isFirstPage ? '"apa_citation": "your APA citation here"' : ''}
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content?.trim() || '{}';
    let parsed: { summary?: string; topic_tag?: string; apa_citation?: string } = {};
    
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      logger.ragError('Failed to parse summary JSON', parseError as Error, {
        pageNumber,
        content: content.substring(0, 200),
      });
      // Fallback: try to extract summary from raw content
      parsed = {
        summary: content.substring(0, 200),
      };
    }

    const result = {
      summary: parsed.summary?.trim() || undefined,
      topic_tag: parsed.topic_tag?.trim() || undefined,
      apa_citation: (isFirstPage && parsed.apa_citation?.trim()) || undefined,
    };
    
    logger.rag('Page summary generated', { 
      pageNumber, 
      summaryLength: result.summary?.length || 0,
      hasTopicTag: !!result.topic_tag,
      hasCitation: !!result.apa_citation,
    });

    res.json(result);
  } catch (error: any) {
    logger.ragError('Failed to generate page summary', error, {
      pageNumber,
      errorMessage: error.message,
    });
    res.json({ 
      summary: undefined, 
      topic_tag: undefined, 
      apa_citation: undefined 
    });
  }
});

/**
 * Get Groq API key for client-side processing
 * GET /rag/groq-api-key
 * Returns Groq API key for client-side PDF summarization
 * Note: In production, consider using a proxy endpoint instead of exposing the key
 */
router.get('/groq-api-key', (req, res) => {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return res.status(503).json({ 
      error: 'Groq API key not configured',
      available: false 
    });
  }
  res.json({ 
    apiKey: groqApiKey,
    available: true 
  });
});

export default router;
