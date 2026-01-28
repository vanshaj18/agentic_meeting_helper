import { Agent, CreateAgentData } from '../../../shared/types';
import { logger } from '../utils/logger';

// In-memory storage (replace with database in production)
const predefinedAgents: Agent[] = [
  {
    id: 1,
    name: 'Competitor Analysis Agent',
    description: 'Competitor Analysis Agent',
    tags: ['Business', 'Pitching'],
    prompt: 'You are a competitive analysis expert. Analyze competitor information and provide strategic insights.',
    guardrails: 'Focus on publicly available information. Provide objective analysis.'
  },
  {
    id: 2,
    name: 'What to say next?',
    description: 'What to say next?',
    tags: [],
    prompt: 'You are an AI meeting guidance agent with deep expertise in corporate, project, and stakeholder meetings, capable of understanding context, objectives, participant roles, and conversation dynamics to offer the optimal next comment or question.\n\nYou must adopt a professional, concise, supportive, and action-oriented tone; provide all outputs in markdown format as exactly two lines—first line being the suggested user statement or question, second line being the brief rationale; ask clarifying questions only when essential; never reveal internal reasoning or off-topic commentary; avoid personal data collection; and always focus on driving the meeting toward its stated goals (for example, if the discussion stalls on resource allocation, you might suggest "Could we prioritize tasks based on impact and resource availability?" followed by "This helps align budget and effort with our key objectives.").',
    guardrails: 'Never reveal internal reasoning. Focus on meeting goals. Avoid personal data collection.'
  },
  {
    id: 3,
    name: 'GTM Advisor',
    description: 'Go to Market advisor',
    tags: [],
    prompt: 'You are a Go-to-Market strategy expert. Provide actionable advice on market entry, positioning, and growth strategies.',
    guardrails: 'Base recommendations on industry best practices. Consider market dynamics and competitive landscape.'
  },
  {
    id: 4,
    name: 'Counterpoint agent',
    description: 'Critique the point raised and generate a counter point t...',
    tags: [],
    prompt: 'You are a critical thinking agent. Analyze arguments and provide thoughtful counterpoints to strengthen discussions.',
    guardrails: 'Maintain constructive tone. Focus on logical reasoning and evidence-based critiques.'
  },
  {
    id: 5,
    name: 'Summarize till now',
    description: 'Summarize the meeting till now',
    tags: [],
    prompt: 'You are a meeting summarization agent. Provide concise, accurate summaries of meeting discussions and decisions.',
    guardrails: 'Include key points, decisions, and action items. Maintain neutrality and accuracy.'
  },
  {
    id: 6,
    name: 'Cue Card Agent',
    description: 'A specialized agent designed to help users prepare for ...',
    tags: [],
    prompt: 'You are a presentation preparation expert. Help users create and refine cue cards for effective presentations.',
    guardrails: 'Focus on clarity and conciseness. Provide actionable talking points.'
  },
  {
    id: 7,
    name: 'AI Answer',
    description: 'An intelligent Q&A assistant that provides accurate, real...',
    tags: [],
    prompt: 'You are an intelligent Q&A assistant. Provide accurate, real-time answers to questions during meetings.',
    guardrails: 'Ensure factual accuracy. Cite sources when possible. Acknowledge uncertainty when appropriate.'
  }
];

let myAgents: Agent[] = [];
let nextId = 8;

export const getAgents = (type?: 'predefined' | 'my'): Agent[] => {
  const agents = type === 'my' ? myAgents : predefinedAgents;
  logger.agent('Retrieving agents', { type: type || 'all', count: agents.length });
  return agents;
};

export const getAllAgents = (): Agent[] => {
  const allAgents = [...predefinedAgents, ...myAgents];
  logger.agent('Retrieving all agents', { totalCount: allAgents.length });
  return allAgents;
};

export const getAgentById = (id: number): Agent | undefined => {
  const agent = getAllAgents().find(a => a.id === id);
  logger.agent('Retrieved agent by ID', { agentId: id, found: !!agent });
  return agent;
};

export const createAgent = (data: CreateAgentData): Agent => {
  logger.agent('Creating new agent', { name: data.name, tagCount: data.tags ? data.tags.split(',').length : 0 });
  const newAgent: Agent = {
    id: nextId++,
    name: data.name,
    description: data.description,
    tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
    prompt: data.prompt,
    guardrails: data.guardrails
  };
  myAgents.push(newAgent);
  logger.agent('Agent created successfully', { agentId: newAgent.id, name: newAgent.name });
  return newAgent;
};

export const updateAgent = (id: number, updates: Partial<CreateAgentData>): Agent | undefined => {
  logger.agent('Updating agent', { agentId: id, updates: Object.keys(updates) });
  const index = myAgents.findIndex(a => a.id === id);
  if (index === -1) {
    logger.agentError('Agent not found for update', undefined, { agentId: id });
    return undefined;
  }
  
  const agent = myAgents[index];
  myAgents[index] = {
    ...agent,
    name: updates.name ?? agent.name,
    description: updates.description ?? agent.description,
    tags: updates.tags ? updates.tags.split(',').map(t => t.trim()) : agent.tags,
    prompt: updates.prompt ?? agent.prompt,
    guardrails: updates.guardrails ?? agent.guardrails
  };
  logger.agent('Agent updated successfully', { agentId: id });
  return myAgents[index];
};

export const deleteAgent = (id: number): boolean => {
  logger.agent('Deleting agent', { agentId: id });
  const index = myAgents.findIndex(a => a.id === id);
  if (index === -1) {
    logger.agentError('Agent not found for deletion', undefined, { agentId: id });
    return false;
  }
  
  myAgents.splice(index, 1);
  logger.agent('Agent deleted successfully', { agentId: id });
  return true;
};
