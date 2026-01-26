import OpenAI from 'openai';
import { Session, Agent } from '../../../shared/types';
import { tavilyService } from './tavilyService';
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
    try {
      if (!apiKey) {
        return {
          content: '',
          error: 'OPENAI_API_KEY not configured. Please set it in your .env file.',
        };
      }

      const transcriptText = session.transcript
        .map((msg) => `${msg.sender}: ${msg.message}`)
        .join('\n');

      if (!transcriptText.trim()) {
        return {
          content: '',
          error: 'No transcript available to generate summary',
        };
      }

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
      return { content };
    } catch (error: any) {
      console.error('Error generating summary:', error);
      return {
        content: '',
        error: error.message || 'Failed to generate summary',
      };
    }
  }

  /**
   * Answer questions about the session using conversation context
   * @param useWebSearch - If true, search the web using Tavily and include results in context
   */
  async askQuestion(
    session: Session,
    question: string,
    agent?: Agent,
    documents?: string[],
    useWebSearch?: boolean
  ): Promise<LLMResponse> {
    try {
      if (!apiKey) {
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

      // Add web search results if requested
      if (useWebSearch) {
        const webResults = await tavilyService.searchWeb(question);
        if (webResults) {
          contextParts.push(webResults);
        }
      }

      const fullContext = contextParts.join('\n\n');

      if (!fullContext.trim()) {
        return {
          content: '',
          error: 'No context available to answer questions',
        };
      }

      const systemPrompt = agent
        ? `${agent.prompt}\n\n${agent.guardrails ? `Constraints: ${agent.guardrails}` : ''}`
        : 'You are an AI assistant that answers questions based on meeting sessions, using available documents, conversation context, and web search results when provided.';

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
      return { content };
    } catch (error: any) {
      console.error('Error answering question:', error);
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
    try {
      if (!apiKey) {
        return {
          content: '',
          error: 'OPENAI_API_KEY not configured. Please set it in your .env file.',
        };
      }

      const transcriptText = session.transcript
        .map((msg) => `${msg.sender}: ${msg.message}`)
        .join('\n');

      if (!transcriptText.trim()) {
        return {
          content: '',
          error: 'No transcript available to generate answers',
        };
      }

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
      return { content };
    } catch (error: any) {
      console.error('Error generating answers:', error);
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
