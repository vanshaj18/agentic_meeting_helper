import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Session, Document, Agent, ChatMessage } from '@shared/types';

interface AppContextType {
  sessions: Session[];
  documents: Document[];
  cueCards: Document[];
  predefinedAgents: Agent[];
  myAgents: Agent[];
  chatMessages: ChatMessage[];
  selectedSession: Session | null;
  selectedDocument: Document | null;
  selectedAgent: Agent | null;
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  setCueCards: React.Dispatch<React.SetStateAction<Document[]>>;
  setPredefinedAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  setMyAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setSelectedSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setSelectedDocument: React.Dispatch<React.SetStateAction<Document | null>>;
  setSelectedAgent: React.Dispatch<React.SetStateAction<Agent | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cueCards, setCueCards] = useState<Document[]>([]);
  const [predefinedAgents, setPredefinedAgents] = useState<Agent[]>([]);
  const [myAgents, setMyAgents] = useState<Agent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <AppContext.Provider
      value={{
        sessions,
        documents,
        cueCards,
        predefinedAgents,
        myAgents,
        chatMessages,
        selectedSession,
        selectedDocument,
        selectedAgent,
        setSessions,
        setDocuments,
        setCueCards,
        setPredefinedAgents,
        setMyAgents,
        setChatMessages,
        setSelectedSession,
        setSelectedDocument,
        setSelectedAgent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
