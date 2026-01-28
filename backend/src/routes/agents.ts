import express from 'express';
import { Agent, CreateAgentData } from '../../../shared/types';
import { getAgents, createAgent, updateAgent, deleteAgent, getAgentById } from '../services/agentService';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all agents
router.get('/', (req, res) => {
  const type = req.query.type as 'predefined' | 'my' | undefined;
  logger.agent('API: Get agents request', { type });
  try {
    const agents = getAgents(type);
    logger.agent('API: Agents retrieved', { type, count: agents.length });
    res.json(agents);
  } catch (error: any) {
    logger.agentError('API: Failed to fetch agents', error, { type });
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get agent by ID
router.get('/:id', (req, res) => {
  const agentId = parseInt(req.params.id);
  logger.agent('API: Get agent by ID request', { agentId });
  try {
    const agent = getAgentById(agentId);
    if (!agent) {
      logger.agentError('API: Agent not found', undefined, { agentId });
      return res.status(404).json({ error: 'Agent not found' });
    }
    logger.agent('API: Agent retrieved', { agentId });
    res.json(agent);
  } catch (error: any) {
    logger.agentError('API: Failed to fetch agent', error, { agentId });
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Create new agent
router.post('/', (req, res) => {
  logger.agent('API: Create agent request', { name: req.body.name });
  try {
    const agentData: CreateAgentData = req.body;
    const newAgent = createAgent(agentData);
    logger.agent('API: Agent created', { agentId: newAgent.id, name: newAgent.name });
    res.status(201).json(newAgent);
  } catch (error: any) {
    logger.agentError('API: Failed to create agent', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', (req, res) => {
  const agentId = parseInt(req.params.id);
  logger.agent('API: Update agent request', { agentId, updates: Object.keys(req.body) });
  try {
    const updates = req.body;
    const updatedAgent = updateAgent(agentId, updates);
    if (!updatedAgent) {
      logger.agentError('API: Agent not found for update', undefined, { agentId });
      return res.status(404).json({ error: 'Agent not found' });
    }
    logger.agent('API: Agent updated', { agentId });
    res.json(updatedAgent);
  } catch (error: any) {
    logger.agentError('API: Failed to update agent', error, { agentId });
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', (req, res) => {
  const agentId = parseInt(req.params.id);
  logger.agent('API: Delete agent request', { agentId });
  try {
    const deleted = deleteAgent(agentId);
    if (!deleted) {
      logger.agentError('API: Agent not found for deletion', undefined, { agentId });
      return res.status(404).json({ error: 'Agent not found' });
    }
    logger.agent('API: Agent deleted', { agentId });
    res.json({ message: 'Agent deleted successfully' });
  } catch (error: any) {
    logger.agentError('API: Failed to delete agent', error, { agentId });
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

export default router;
