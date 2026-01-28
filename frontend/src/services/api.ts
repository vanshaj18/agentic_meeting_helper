import axios from 'axios';
import { Session, Document, Agent, CreateSessionData, CreateAgentData, UploadDocumentData, Template, CreateTemplateData } from '@shared/types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sessions API
export const sessionsAPI = {
  getAll: () => api.get<Session[]>('/sessions').then(res => res.data),
  getById: (id: number) => api.get<Session>(`/sessions/${id}`).then(res => res.data),
  create: (data: CreateSessionData) => api.post<Session>('/sessions', data).then(res => res.data),
  update: (id: number, updates: Partial<Session>) => api.put<Session>(`/sessions/${id}`, updates).then(res => res.data),
  delete: (id: number) => api.delete(`/sessions/${id}`).then(res => res.data),
  addTranscript: (id: number, messages: any[]) => api.post<Session>(`/sessions/${id}/transcript`, { messages }).then(res => res.data),
};

// Documents API
export const documentsAPI = {
  getAll: (type?: 'document' | 'cuecard') => {
    const params = type ? { type } : {};
    return api.get<Document[]>('/documents', { params }).then(res => res.data);
  },
  create: (data: UploadDocumentData, type?: 'document' | 'cuecard') => {
    const params = type ? { type } : {};
    return api.post<Document>('/documents', data, { params }).then(res => res.data);
  },
  update: (id: number, updates: Partial<Document>) => api.put<Document>(`/documents/${id}`, updates).then(res => res.data),
  delete: (id: number) => api.delete(`/documents/${id}`).then(res => res.data),
};

// Agents API
export const agentsAPI = {
  getAll: (type?: 'predefined' | 'my') => {
    const params = type ? { type } : {};
    return api.get<Agent[]>('/agents', { params }).then(res => res.data);
  },
  getById: (id: number) => api.get<Agent>(`/agents/${id}`).then(res => res.data),
  create: (data: CreateAgentData) => api.post<Agent>('/agents', data).then(res => res.data),
  update: (id: number, updates: Partial<CreateAgentData>) => api.put<Agent>(`/agents/${id}`, updates).then(res => res.data),
  delete: (id: number) => api.delete(`/agents/${id}`).then(res => res.data),
};

// Templates API
export const templatesAPI = {
  getAll: () => api.get<Template[]>('/templates').then(res => res.data),
  getById: (id: number) => api.get<Template>(`/templates/${id}`).then(res => res.data),
  create: (data: CreateTemplateData) => api.post<Template>('/templates', data).then(res => res.data),
  update: (id: number, updates: Partial<CreateTemplateData>) => api.put<Template>(`/templates/${id}`, updates).then(res => res.data),
  delete: (id: number) => api.delete(`/templates/${id}`).then(res => res.data),
};

// LLM API
export const llmAPI = {
  generateSummary: (sessionId: number, agentId?: number) =>
    api.post<{ summary: string }>(`/llm/sessions/${sessionId}/summary`, { agentId }).then(res => res.data),
  askQuestion: (sessionId: number, question: string, agentId?: number, useWebSearch?: boolean, useRAGSearch?: boolean, indexedDBChunks?: Array<{ id: string; text: string; score?: number; metadata?: Record<string, any> }>, username?: string) =>
    api.post<{ answer: string }>(`/llm/sessions/${sessionId}/ask`, { question, agentId, useWebSearch, useRAGSearch, indexedDBChunks, username }).then(res => res.data),
  generateAnswers: (sessionId: number, agentId?: number, qaPairs?: { question: string; answer: string }[]) =>
    api.post<{ answers: string }>(`/llm/sessions/${sessionId}/answers`, { agentId, qaPairs }).then(res => res.data),
  // Global chat (no session required)
  globalChat: (question: string, agentId?: number, useWebSearch?: boolean, useRAGSearch?: boolean, indexedDBChunks?: Array<{ id: string; text: string; score?: number; metadata?: Record<string, any> }>, username?: string, isFirstMessage?: boolean) =>
    api.post<{ answer: string }>(`/llm/chat`, { question, agentId, useWebSearch, useRAGSearch, indexedDBChunks, username, isFirstMessage }).then(res => res.data),
};

// RAG API
export const ragAPI = {
  searchIndexedDB: (query: string, userId: string, documentId?: number, topK?: number) => {
    // This would be handled client-side via indexedDBService
    // But we can add an endpoint if needed for server-side coordination
    return Promise.resolve([]);
  },
  summarizePage: (text: string, pageNumber: number, isFirstPage?: boolean) =>
    api.post<{ summary?: string; topic_tag?: string; apa_citation?: string }>('/rag/summarize-page', { 
      text, 
      pageNumber, 
      isFirstPage 
    }).then(res => res.data),
};

// Email API
export const emailAPI = {
  sendMeetingRecap: (payload: {
    to: string;
    meetingTitle: string;
    date: string;
    summary: string;
    keyDetails: string[];
    transcript: string;
  }) =>
    api.post<{ success: boolean; message?: string; error?: string }>('/email/meeting-recap', payload).then(res => res.data),
};

export default api;
