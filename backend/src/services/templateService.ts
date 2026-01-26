import { Template, CreateTemplateData } from '../../../shared/types';

// In-memory storage (replace with database in production)
let templates: Template[] = [];
let nextId = 1;

export const getTemplates = (): Template[] => {
  return templates;
};

export const getTemplateById = (id: number): Template | undefined => {
  return templates.find(t => t.id === id);
};

export const createTemplate = (data: CreateTemplateData): Template => {
  const newTemplate: Template = {
    id: nextId++,
    name: data.name,
    meetingContext: data.meetingContext,
    agentIds: data.agentIds || [],
    documentIds: data.documentIds || [],
    cueCardIds: data.cueCardIds || [],
  };
  templates.push(newTemplate);
  return newTemplate;
};

export const updateTemplate = (id: number, updates: Partial<CreateTemplateData>): Template | undefined => {
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return undefined;
  
  templates[index] = {
    ...templates[index],
    name: updates.name ?? templates[index].name,
    meetingContext: updates.meetingContext ?? templates[index].meetingContext,
    agentIds: updates.agentIds ?? templates[index].agentIds,
    documentIds: updates.documentIds ?? templates[index].documentIds,
    cueCardIds: updates.cueCardIds ?? templates[index].cueCardIds,
  };
  return templates[index];
};

export const deleteTemplate = (id: number): boolean => {
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return false;
  
  templates.splice(index, 1);
  return true;
};
