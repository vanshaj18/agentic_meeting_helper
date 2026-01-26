import express from 'express';
import { Session, CreateSessionData, TranscriptMessage } from '../../../shared/types';
import { getSessions, createSession, getSessionById, updateSession, deleteSession, addTranscriptMessages } from '../services/sessionService';
import { getTemplateById } from '../services/templateService';

const router = express.Router();

// Get all sessions
router.get('/', (req, res) => {
  try {
    const sessions = getSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session by ID
router.get('/:id', (req, res) => {
  try {
    const session = getSessionById(parseInt(req.params.id));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Create new session
router.post('/', (req, res) => {
  try {
    const sessionData: CreateSessionData = req.body;
    
    // If template is selected, merge template's agentIds with session agentIds
    let finalAgentIds = sessionData.agentIds || [];
    
    if (sessionData.template) {
      const templateId = parseInt(sessionData.template);
      const template = getTemplateById(templateId);
      
      if (template && template.agentIds) {
        // Merge template agentIds with session agentIds (avoid duplicates)
        const templateAgentIds = template.agentIds;
        const mergedAgentIds = [...new Set([...templateAgentIds, ...finalAgentIds])];
        finalAgentIds = mergedAgentIds;
      }
    }
    
    // Create session with merged agentIds
    const sessionDataWithAgents = {
      ...sessionData,
      agentIds: finalAgentIds,
    };
    
    const newSession = createSession(sessionDataWithAgents);
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update session
router.put('/:id', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const updates = req.body;
    const updatedSession = updateSession(sessionId, updates);
    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete session
router.delete('/:id', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const deleted = deleteSession(sessionId);
    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Add transcript messages to session
router.post('/:id/transcript', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    const updatedSession = addTranscriptMessages(sessionId, messages);
    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add transcript messages' });
  }
});

export default router;
