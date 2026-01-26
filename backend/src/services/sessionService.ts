import { Session, CreateSessionData, TranscriptMessage } from '../../../shared/types';

// In-memory storage (replace with database in production)
let sessions: Session[] = [
  {
    id: 1,
    name: 'test',
    description: 'No description',
    date: '24/01/26 16:45',
    transcript: [
      { sender: 'vanshaj kerni', message: 'hi', time: '11:15 AM', isUser: true },
      { sender: 'JarWiz', message: 'The phrase "vanshaj kerni" is in Hindi, where "vanshaj" means "descendant" or "offspring," and "kerni" translates to "to do" or "to perform." Together, it can be interpreted as "to perform or carry out the lineage" or "to continue the family line."', time: '11:15 AM', isUser: false },
      { sender: 'vanshaj kerni', message: 'What specific topics or issues would you like to discuss in this meeting?', time: '11:15 AM', isUser: true },
      { sender: 'JarWiz', message: 'In this meeting, it would be beneficial to discuss a range of key topics that can drive our objectives forward. Here are some suggestions:\n\nProject Updates: Share progress on ongoing projects and any challenges faced.', time: '11:15 AM', isUser: false }
    ]
  }
];

let nextId = 2;

export const getSessions = (): Session[] => {
  return sessions;
};

export const getSessionById = (id: number): Session | undefined => {
  return sessions.find(s => s.id === id);
};

export const createSession = (data: CreateSessionData): Session => {
  // Use provided date/time or default to current date/time
  let sessionDate: string;
  if (data.date && data.time) {
    // Combine date and time, format as DD/MM/YY HH:mm
    const dateObj = new Date(`${data.date}T${data.time}`);
    sessionDate = dateObj.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
  } else {
    // Default to current date/time
    sessionDate = new Date().toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
  }

  const newSession: Session = {
    id: nextId++,
    name: data.name,
    description: data.description || 'No description',
    date: sessionDate,
    transcript: [],
    agentIds: data.agentIds || [],
    documentIds: data.documents ? (Array.isArray(data.documents) ? data.documents.map(d => parseInt(d)) : [parseInt(data.documents)]) : [],
    cueCardIds: data.cueCard ? (Array.isArray(data.cueCard) ? data.cueCard.map(c => parseInt(c)) : [parseInt(data.cueCard)]) : []
  };
  sessions.push(newSession);
  return newSession;
};

export const updateSession = (id: number, updates: Partial<Session>): Session | undefined => {
  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) return undefined;
  
  sessions[index] = { ...sessions[index], ...updates };
  return sessions[index];
};

export const addTranscriptMessage = (sessionId: number, message: TranscriptMessage): Session | undefined => {
  const session = getSessionById(sessionId);
  if (!session) return undefined;
  
  session.transcript.push(message);
  return session;
};

export const addTranscriptMessages = (sessionId: number, messages: TranscriptMessage[]): Session | undefined => {
  const session = getSessionById(sessionId);
  if (!session) return undefined;
  
  session.transcript.push(...messages);
  return session;
};

export const deleteSession = (id: number): boolean => {
  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) return false;
  
  sessions.splice(index, 1);
  return true;
};
