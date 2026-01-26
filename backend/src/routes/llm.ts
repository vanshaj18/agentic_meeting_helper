import express from 'express';
import { llmService } from '../services/llmService';
import { getSessionById, updateSession } from '../services/sessionService';
import { getAgentById } from '../services/agentService';
import { getDocumentById } from '../services/documentService';
import { combineAgents } from '../services/agentCombinerService';

const router = express.Router();

// Generate summary for a session
router.post('/sessions/:sessionId/summary', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const agentId = req.body.agentId ? parseInt(req.body.agentId) : undefined;

    const session = getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Combine agents from session for dynamic prompt
    let combinedAgent = null;
    if (session.agentIds && session.agentIds.length > 0) {
      combinedAgent = combineAgents(session.agentIds);
    } else if (agentId) {
      const singleAgent = getAgentById(agentId);
      if (singleAgent) {
        combinedAgent = {
          prompt: singleAgent.prompt,
          guardrails: singleAgent.guardrails,
          description: singleAgent.description,
          agentNames: [singleAgent.name],
        };
      }
    }

    const virtualAgent = combinedAgent ? {
      id: 0,
      name: `Combined: ${combinedAgent.agentNames.join(', ')}`,
      description: combinedAgent.description,
      tags: [],
      prompt: combinedAgent.prompt,
      guardrails: combinedAgent.guardrails,
    } : undefined;

    const result = await llmService.generateSummary(session, virtualAgent);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Extract first chunk (first ~200 characters) as description
    const summaryChunk = result.content.substring(0, 200).trim();
    if (summaryChunk) {
      // Remove trailing incomplete sentences
      const lastPeriod = summaryChunk.lastIndexOf('.');
      const lastNewline = summaryChunk.lastIndexOf('\n');
      const cutPoint = Math.max(lastPeriod, lastNewline);
      const description = cutPoint > 50 ? summaryChunk.substring(0, cutPoint + 1) : summaryChunk;
      
      // Update session description with summary chunk
      updateSession(sessionId, { description });
    }

    res.json({ summary: result.content });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate summary' });
  }
});

// Ask a question about a session
router.post('/sessions/:sessionId/ask', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const { question, agentId, useWebSearch } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const session = getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Combine agents from session (template + direct selection) for dynamic prompt
    let combinedAgent = null;
    if (session.agentIds && session.agentIds.length > 0) {
      combinedAgent = combineAgents(session.agentIds);
    } else if (agentId) {
      // Fallback to provided agentId if no session agents
      const singleAgent = getAgentById(agentId);
      if (singleAgent) {
        combinedAgent = {
          prompt: singleAgent.prompt,
          guardrails: singleAgent.guardrails,
          description: singleAgent.description,
          agentNames: [singleAgent.name],
        };
      }
    }

    // Create a virtual agent from combined agents for LLM service
    const virtualAgent = combinedAgent ? {
      id: 0,
      name: `Combined: ${combinedAgent.agentNames.join(', ')}`,
      description: combinedAgent.description,
      tags: [],
      prompt: combinedAgent.prompt,
      guardrails: combinedAgent.guardrails,
    } : undefined;

    // Get document titles for context
    const documentTitles: string[] = [];
    if (session.documentIds) {
      session.documentIds.forEach((docId) => {
        const doc = getDocumentById(docId);
        if (doc) documentTitles.push(doc.title);
      });
    }

    // Build context with session documents if available, and web search if requested
    const result = await llmService.askQuestion(
      session, 
      question, 
      virtualAgent, 
      documentTitles,
      useWebSearch === true
    );

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ answer: result.content });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to answer question' });
  }
});

// Generate answers/insights for a session
router.post('/sessions/:sessionId/answers', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const agentId = req.body.agentId ? parseInt(req.body.agentId) : undefined;
    const qaPairs = req.body.qaPairs; // Optional Q&A pairs from chat

    const session = getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Combine agents from session for dynamic prompt
    let combinedAgent = null;
    if (session.agentIds && session.agentIds.length > 0) {
      combinedAgent = combineAgents(session.agentIds);
    } else if (agentId) {
      const singleAgent = getAgentById(agentId);
      if (singleAgent) {
        combinedAgent = {
          prompt: singleAgent.prompt,
          guardrails: singleAgent.guardrails,
          description: singleAgent.description,
          agentNames: [singleAgent.name],
        };
      }
    }

    const virtualAgent = combinedAgent ? {
      id: 0,
      name: `Combined: ${combinedAgent.agentNames.join(', ')}`,
      description: combinedAgent.description,
      tags: [],
      prompt: combinedAgent.prompt,
      guardrails: combinedAgent.guardrails,
    } : undefined;

    // If Q&A pairs are provided, use them instead of transcript
    let sessionToUse = session;
    if (qaPairs && Array.isArray(qaPairs) && qaPairs.length > 0) {
      // Create a temporary session with Q&A pairs formatted as transcript
      const qaTranscript = qaPairs.map((qa: { question: string; answer: string }, idx: number) => ({
        sender: `User`,
        message: `Question ${idx + 1}: ${qa.question}`,
        time: '',
        isUser: true,
      })).concat(qaPairs.map((qa: { question: string; answer: string }, idx: number) => ({
        sender: `JarWiz`,
        message: `Answer ${idx + 1}: ${qa.answer}`,
        time: '',
        isUser: false,
      })));
      
      sessionToUse = {
        ...session,
        transcript: qaTranscript,
      };
    }

    const result = await llmService.generateAnswers(sessionToUse, virtualAgent);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ answers: result.content });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate answers' });
  }
});

export default router;
