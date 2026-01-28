import express from 'express';
import { Session, CreateSessionData, TranscriptMessage } from '../../../shared/types';
import { getSessions, createSession, getSessionById, updateSession, deleteSession, addTranscriptMessages } from '../services/sessionService';
import { getTemplateById } from '../services/templateService';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all sessions
router.get('/', (req, res) => {
  logger.session('API: Get all sessions request');
  try {
    const sessions = getSessions();
    logger.session('API: Sessions retrieved', { sessionCount: sessions.length });
    res.json(sessions);
  } catch (error: any) {
    logger.sessionError('API: Failed to fetch sessions', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session by ID
router.get('/:id', (req, res) => {
  const sessionId = parseInt(req.params.id);
  logger.session('API: Get session by ID request', { sessionId });
  try {
    const session = getSessionById(sessionId);
    if (!session) {
      logger.sessionError('API: Session not found', undefined, { sessionId });
      return res.status(404).json({ error: 'Session not found' });
    }
    logger.session('API: Session retrieved', { sessionId });
    res.json(session);
  } catch (error: any) {
    logger.sessionError('API: Failed to fetch session', error, { sessionId });
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Create new session
router.post('/', (req, res) => {
  logger.session('API: Create session request', { name: req.body.name });
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
    logger.session('API: Session created', { sessionId: newSession.id, name: newSession.name });
    res.status(201).json(newSession);
  } catch (error: any) {
    logger.sessionError('API: Failed to create session', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update session
router.put('/:id', (req, res) => {
  const sessionId = parseInt(req.params.id);
  logger.session('API: Update session request', { sessionId, updates: Object.keys(req.body) });
  try {
    const updates = req.body;
    const updatedSession = updateSession(sessionId, updates);
    if (!updatedSession) {
      logger.sessionError('API: Session not found for update', undefined, { sessionId });
      return res.status(404).json({ error: 'Session not found' });
    }
    logger.session('API: Session updated', { sessionId });
    res.json(updatedSession);
  } catch (error: any) {
    logger.sessionError('API: Failed to update session', error, { sessionId });
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete session
router.delete('/:id', (req, res) => {
  const sessionId = parseInt(req.params.id);
  logger.session('API: Delete session request', { sessionId });
  try {
    const deleted = deleteSession(sessionId);
    if (!deleted) {
      logger.sessionError('API: Session not found for deletion', undefined, { sessionId });
      return res.status(404).json({ error: 'Session not found' });
    }
    logger.session('API: Session deleted', { sessionId });
    res.json({ message: 'Session deleted successfully' });
  } catch (error: any) {
    logger.sessionError('API: Failed to delete session', error, { sessionId });
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Add transcript messages to session
router.post('/:id/transcript', (req, res) => {
  const sessionId = parseInt(req.params.id);
  logger.session('API: Add transcript messages request', { sessionId, messageCount: req.body.messages?.length });
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      logger.sessionError('API: Invalid messages format', undefined, { sessionId });
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    const updatedSession = addTranscriptMessages(sessionId, messages);
    if (!updatedSession) {
      logger.sessionError('API: Session not found for transcript', undefined, { sessionId });
      return res.status(404).json({ error: 'Session not found' });
    }

    logger.session('API: Transcript messages added', { sessionId, messageCount: messages.length });
    res.json(updatedSession);
  } catch (error: any) {
    logger.sessionError('API: Failed to add transcript messages', error, { sessionId });
    res.status(500).json({ error: 'Failed to add transcript messages' });
  }
});

export default router;
