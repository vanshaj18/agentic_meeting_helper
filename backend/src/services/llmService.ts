import OpenAI from 'openai';
import { Session, Agent } from '../../../shared/types';
import { tavilyService } from './tavilyService';
import { logger } from '../utils/logger';
require('dotenv').config(); 

const apiKey = process.env.OPENAI_API_KEY || '';
if (!apiKey) {
  console.warn('⚠️  Warning: OPENAI_API_KEY not set. LLM features will not work.');
  console.warn('   Please set OPENAI_API_KEY in your .env file to enable LLM features.');
} else {
  console.log('✅ OpenAI API key configured successfully');
}

interface LLMResponse {
  content: string;
  error?: string;
}

/**
 * Agent-based LLM service for modular AI operations
 */
export class LLMService {
  private client: OpenAI;

  constructor() {
    if (!apiKey) {
      console.warn('⚠️  LLMService initialized without API key. LLM operations will fail.');
    }
    this.client = new OpenAI({
      apiKey: apiKey || '',
    });
  }

  /**
   * Generate meeting summary from session transcript
   * Returns structured JSON with specific fields for markdown template
   */
  async generateSummary(session: Session, agent?: Agent): Promise<LLMResponse> {
    logger.llm('Generating session summary', { sessionId: session.id, agentId: agent?.id });
    try {
      if (!apiKey) {
        logger.llmError('OpenAI API key not configured', undefined, { sessionId: session.id });
        return {
          content: '',
          error: 'OPENAI_API_KEY not configured. Please set it in your .env file.',
        };
      }

      const transcriptText = session.transcript
        .map((msg) => `${msg.sender}: ${msg.message}`)
        .join('\n');

      if (!transcriptText.trim()) {
        logger.llmError('No transcript available', undefined, { sessionId: session.id });
        return {
          content: '',
          error: 'No transcript available to generate summary',
        };
      }

      logger.llm('Summary generation started', { sessionId: session.id, transcriptLength: transcriptText.length });

      const systemPrompt = agent
        ? `${agent.prompt}\n\n${agent.guardrails ? `Constraints: ${agent.guardrails}` : ''}\n\nYou must respond ONLY with valid JSON.`
        : 'You are an AI assistant that generates structured meeting summaries. You must respond ONLY with valid JSON.';

      const userPrompt = `Analyze this meeting transcript and extract key information. Return ONLY a valid JSON object with the following structure (keep responses concise to optimize tokens):

{
  "purpose": "Brief purpose of the meeting (1-2 sentences)",
  "what_happened": "Summary of what happened during the meeting (2-3 sentences)",
  "what_was_done": "What was accomplished or decided (2-3 sentences)",
  "what_asked": "Key questions that were asked (bullet points or short list)",
  "key_takeaways": "Main insights or learnings (2-3 bullet points)",
  "action_items": "Action items or next steps (bullet points)"
}

Meeting Transcript:
${transcriptText}

Return ONLY the JSON object, no additional text or markdown formatting.`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '';
      logger.llm('Summary generated successfully', { sessionId: session.id, contentLength: content.length });
      return { content };
    } catch (error: any) {
      logger.llmError('Failed to generate summary', error, { sessionId: session.id });
      return {
        content: '',
        error: error.message || 'Failed to generate summary',
      };
    }
  }

  /**
   * Answer questions about the session using conversation context
   * @param useWebSearch - If true, search the web using Tavily and include results in context
   * @param useRAGSearch - If true, use RAG pipeline to retrieve and generate answer with citations
   * @param indexedDBChunks - Chunks from IndexedDB (client-side storage for small files)
   */
  async askQuestion(
    session: Session,
    question: string,
    agent?: Agent,
    documents?: string[],
    useWebSearch?: boolean,
    useRAGSearch?: boolean,
    indexedDBChunks?: Array<{
      id: string;
      text: string;
      score?: number;
      metadata?: Record<string, any>;
    }>,
    username?: string
  ): Promise<LLMResponse> {
    logger.llm('Processing question', { 
      sessionId: session.id, 
      question: question.substring(0, 100), 
      agentId: agent?.id,
      useWebSearch: useWebSearch || false,
      useRAGSearch: useRAGSearch || false,
      documentCount: documents?.length || 0
    });
    try {
      if (!apiKey) {
        logger.llmError('OpenAI API key not configured', undefined, { sessionId: session.id });
        return {
          content: '',
          error: 'OPENAI_API_KEY not configured. Please set it in your .env file.',
        };
      }

      const transcriptText = session.transcript
        .map((msg) => `${msg.sender}: ${msg.message}`)
        .join('\n');

      // Build context with session description and documents
      let contextParts = [];
      
      if (session.description && session.description !== 'No description') {
        contextParts.push(`Session Context: ${session.description}`);
      }

      if (documents && documents.length > 0) {
        contextParts.push(`Available Documents: ${documents.join(', ')}`);
      }

      if (transcriptText.trim()) {
        contextParts.push(`Meeting Transcript:\n${transcriptText}`);
      }

      // Add RAG search results if requested (priority over web search)
      if (useRAGSearch) {
        try {
          logger.llm('Initiating RAG search', { 
            sessionId: session.id, 
            question: question.substring(0, 100),
            indexedDBChunkCount: indexedDBChunks?.length || 0
          });
          const { HybridRetrieverService } = await import('../lib/rag/retrieve');
          const { generateAnswer } = await import('../lib/rag/generate');
          
          const hybridRetriever = new HybridRetrieverService();
          const userId = 'default-user'; // TODO: Get from auth
          
          // Retrieve relevant documents from Pinecone (large files)
          const retrievalResult = await hybridRetriever.retrieve(question, userId, 5);
          
          // Merge IndexedDB chunks (small files) with Pinecone results
          const allChunks = [...retrievalResult.chunks];
          if (indexedDBChunks && indexedDBChunks.length > 0) {
            const indexedDBRetrievedChunks = indexedDBChunks.map(chunk => ({
              id: chunk.id,
              text: chunk.text,
              score: chunk.score || 0,
              metadata: {
                ...chunk.metadata,
                source: 'indexeddb',
              },
              source: 'vector' as const,
            }));
            allChunks.push(...indexedDBRetrievedChunks);
            logger.llm('Merged IndexedDB chunks with Pinecone results', {
              sessionId: session.id,
              pineconeCount: retrievalResult.chunks.length,
              indexedDBCount: indexedDBChunks.length,
              totalCount: allChunks.length,
            });
          }
          
          if (allChunks.length > 0) {
            // Generate answer with citations using merged chunks
            const generationResult = await generateAnswer(
              question,
              allChunks.map(chunk => ({
                id: chunk.id,
                content: chunk.text,
                original_score: chunk.score,
                metadata: chunk.metadata,
              })),
              5
            );
            
            // Use RAG-generated answer directly
            logger.llm('RAG search completed', { 
              sessionId: session.id, 
              answerLength: generationResult.answer.length,
              citationCount: generationResult.citations.length,
              totalChunksUsed: allChunks.length
            });
            return { content: generationResult.answer };
          } else {
            logger.llm('No RAG results found, falling back to standard LLM', { sessionId: session.id });
          }
        } catch (error: any) {
          logger.llmError('RAG search failed, falling back to standard LLM', error, { sessionId: session.id });
          // Fall through to standard LLM processing
        }
      }

      // Add web search results if requested (only if RAG search not used)
      if (useWebSearch && !useRAGSearch) {
        logger.llm('Initiating web search', { sessionId: session.id, question: question.substring(0, 100) });
        const webResults = await tavilyService.searchWeb(question);
        if (webResults) {
          contextParts.push(webResults);
          logger.llm('Web search results added to context', { sessionId: session.id, resultsLength: webResults.length });
        } else {
          logger.llm('No web search results returned', { sessionId: session.id });
        }
      }

      const fullContext = contextParts.join('\n\n');

      if (!fullContext.trim()) {
        return {
          content: '',
          error: 'No context available to answer questions',
        };
      }

      // Build system prompt with username if provided
      let systemPrompt = agent
        ? `${agent.prompt}\n\n${agent.guardrails ? `Constraints: ${agent.guardrails}` : ''}`
        : 'You are an AI assistant that answers questions based on meeting sessions, using available documents, conversation context, and web search results when provided.';
      
      // Add username instruction if provided (only for greeting on first interaction)
      if (username) {
        systemPrompt += `\n\nImportant: The user's name is ${username}. Greet the user by name in your first response only. After the initial greeting, keep responses concise and focused.`;
      }
      
      // Add response length constraint for all responses
      systemPrompt += `\n\nKeep your responses concise and limited to 4-5 lines maximum. Provide a brief summary or direct answer without unnecessary elaboration.`;

      const userPrompt = `Context from meeting session:\n${fullContext}\n\nQuestion: ${question}`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content || '';
      logger.llm('Question answered successfully', { sessionId: session.id, answerLength: content.length });
      return { content };
    } catch (error: any) {
      logger.llmError('Failed to answer question', error, { sessionId: session.id, question: question.substring(0, 100) });
      return {
        content: '',
        error: error.message || 'Failed to answer question',
      };
    }
  }

  /**
   * Generate conversation insights and answers
   */
  async generateAnswers(session: Session, agent?: Agent): Promise<LLMResponse> {
    logger.llm('Generating answers and insights', { sessionId: session.id, agentId: agent?.id });
    try {
      if (!apiKey) {
        logger.llmError('OpenAI API key not configured', undefined, { sessionId: session.id });
        return {
          content: '',
          error: 'OPENAI_API_KEY not configured. Please set it in your .env file.',
        };
      }

      const transcriptText = session.transcript
        .map((msg) => `${msg.sender}: ${msg.message}`)
        .join('\n');

      if (!transcriptText.trim()) {
        logger.llmError('No transcript available', undefined, { sessionId: session.id });
        return {
          content: '',
          error: 'No transcript available to generate answers',
        };
      }

      logger.llm('Answers generation started', { sessionId: session.id, transcriptLength: transcriptText.length });

      const systemPrompt = agent
        ? `${agent.prompt}\n\n${agent.guardrails ? `Constraints: ${agent.guardrails}` : ''}`
        : 'You are an AI assistant that analyzes meeting conversations and provides insights.';

      const userPrompt = agent
        ? `Analyze this meeting conversation and provide key insights, answers to implicit questions, and important takeaways:\n\n${transcriptText}`
        : `Analyze this meeting conversation and provide:\n1. Key insights from the discussion\n2. Answers to implicit questions raised\n3. Important takeaways\n4. Action items identified\n\nMeeting Transcript:\n${transcriptText}`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content || '';
      logger.llm('Answers generated successfully', { sessionId: session.id, contentLength: content.length });
      return { content };
    } catch (error: any) {
      logger.llmError('Failed to generate answers', error, { sessionId: session.id });
      return {
        content: '',
        error: error.message || 'Failed to generate answers',
      };
    }
  }

  /**
   * Process with specific agent
   */
  async processWithAgent(
    session: Session,
    agent: Agent,
    task: 'summary' | 'conversation' | 'question',
    question?: string
  ): Promise<LLMResponse> {
    switch (task) {
      case 'summary':
        return this.generateSummary(session, agent);
      case 'conversation':
        return this.generateAnswers(session, agent);
      case 'question':
        if (!question) {
          return { content: '', error: 'Question is required' };
        }
        return this.askQuestion(session, question, agent);
      default:
        return { content: '', error: 'Invalid task' };
    }
  }
}

export const llmService = new LLMService();
