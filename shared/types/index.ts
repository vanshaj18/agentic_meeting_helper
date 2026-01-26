export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  id: number;
  name: string;
  description: string;
  date: string;
  transcript: TranscriptMessage[];
  agentIds?: number[];
  documentIds?: number[];
  cueCardIds?: number[];
  summary?: string;
  summaryData?: {
    purpose?: string;
    what_happened?: string;
    what_was_done?: string;
    what_asked?: string;
    key_takeaways?: string;
    action_items?: string;
  };
}

export interface TranscriptMessage {
  sender: string;
  message: string;
  time: string;
  isUser: boolean;
}

export interface Document {
  id: number;
  title: string;
  description: string;
  type: 'document' | 'cuecard';
  fileUrl?: string;
  fileName?: string;
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  tags: string[];
  prompt: string;
  guardrails: string;
}

export interface ChatMessage {
  text: string;
  isUser: boolean;
  time: string;
}

export interface CreateSessionData {
  name: string;
  template?: string;
  description?: string;
  documents?: string;
  cueCard?: string;
  agentIds?: number[];
  date?: string;
  time?: string;
}

export interface CreateAgentData {
  name: string;
  description: string;
  tags: string;
  prompt: string;
  guardrails: string;
}

export interface UploadDocumentData {
  title: string;
  description: string;
  file: File | null;
}

export interface Template {
  id: number;
  name: string;
  meetingContext: string;
  agentIds: number[];
  documentIds: number[];
  cueCardIds: number[];
}

export interface CreateTemplateData {
  name: string;
  meetingContext: string;
  agentIds: number[];
  documentIds: number[];
  cueCardIds: number[];
}
