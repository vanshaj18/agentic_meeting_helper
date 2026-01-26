import { Agent } from '../../../shared/types';
import { getAgentById } from './agentService';

export interface CombinedAgent {
  prompt: string;
  guardrails: string;
  description: string;
  agentNames: string[];
}

/**
 * Combines multiple agents into a unified prompt and guardrails
 * Used for creating dynamic session-specific AI Answer agents
 */
export const combineAgents = (agentIds: number[]): CombinedAgent | null => {
  if (!agentIds || agentIds.length === 0) {
    return null;
  }

  const agents: Agent[] = [];
  const agentNames: string[] = [];

  // Get all agents
  for (const agentId of agentIds) {
    const agent = getAgentById(agentId);
    if (agent) {
      agents.push(agent);
      agentNames.push(agent.name);
    }
  }

  if (agents.length === 0) {
    return null;
  }

  // Combine prompts
  const promptParts: string[] = [];
  const guardrailParts: string[] = [];
  const descriptionParts: string[] = [];

  agents.forEach((agent, index) => {
    // Add agent role/personality
    if (agent.description) {
      descriptionParts.push(`${agent.name}: ${agent.description}`);
    }

    // Add prompt
    if (agent.prompt) {
      if (agents.length === 1) {
        promptParts.push(agent.prompt);
      } else {
        promptParts.push(`${agent.name}:\n${agent.prompt}`);
      }
    }

    // Add guardrails
    if (agent.guardrails) {
      guardrailParts.push(`${agent.name}: ${agent.guardrails}`);
    }
  });

  // Build combined prompt
  let combinedPrompt = '';
  if (agents.length === 1) {
    combinedPrompt = promptParts[0] || '';
  } else {
    combinedPrompt = `You are an AI assistant that combines the expertise and perspectives of multiple specialized agents:\n\n${promptParts.join('\n\n')}\n\nIntegrate insights from all these perspectives when answering questions.`;
  }

  // Build combined guardrails
  const combinedGuardrails = guardrailParts.length > 0
    ? `Important constraints and guidelines:\n${guardrailParts.join('\n')}`
    : '';

  // Build combined description
  const combinedDescription = descriptionParts.length > 0
    ? descriptionParts.join(' | ')
    : '';

  return {
    prompt: combinedPrompt,
    guardrails: combinedGuardrails,
    description: combinedDescription,
    agentNames,
  };
};
