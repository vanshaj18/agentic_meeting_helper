import express from 'express';
import { Agent, CreateAgentData } from '../../../shared/types';
import { getAgents, createAgent, updateAgent, deleteAgent, getAgentById } from '../services/agentService';

const router = express.Router();

// Get all agents
router.get('/', (req, res) => {
  try {
    const type = req.query.type as 'predefined' | 'my' | undefined;
    const agents = getAgents(type);
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get agent by ID
router.get('/:id', (req, res) => {
  try {
    const agent = getAgentById(parseInt(req.params.id));
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Create new agent
router.post('/', (req, res) => {
  try {
    const agentData: CreateAgentData = req.body;
    const newAgent = createAgent(agentData);
    res.status(201).json(newAgent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const updates = req.body;
    const updatedAgent = updateAgent(agentId, updates);
    if (!updatedAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(updatedAgent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const deleted = deleteAgent(agentId);
    if (!deleted) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

export default router;
