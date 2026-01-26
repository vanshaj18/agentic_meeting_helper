import { Document, UploadDocumentData } from '../../../shared/types';

// In-memory storage (replace with database in production)
let documents: Document[] = [
  { id: 1, title: 'CV', description: 'No description', type: 'document' }
];

let cueCards: Document[] = [];
let nextId = 2;

export const getDocuments = (type?: 'document' | 'cuecard'): Document[] => {
  if (type === 'cuecard') {
    return cueCards;
  }
  return documents;
};

export const getAllDocuments = (): Document[] => {
  return [...documents, ...cueCards];
};

export const createDocument = (data: UploadDocumentData): Document => {
  const newDoc: Document = {
    id: nextId++,
    title: data.title,
    description: data.description,
    type: 'document'
  };
  documents.push(newDoc);
  return newDoc;
};

export const createCueCard = (data: UploadDocumentData): Document => {
  const newCard: Document = {
    id: nextId++,
    title: data.title,
    description: data.description,
    type: 'cuecard'
  };
  cueCards.push(newCard);
  return newCard;
};

export const updateDocument = (id: number, updates: Partial<Document>): Document | undefined => {
  let doc = documents.find(d => d.id === id);
  if (doc) {
    const index = documents.findIndex(d => d.id === id);
    documents[index] = { ...doc, ...updates };
    return documents[index];
  }
  
  doc = cueCards.find(c => c.id === id);
  if (doc) {
    const index = cueCards.findIndex(c => c.id === id);
    cueCards[index] = { ...doc, ...updates };
    return cueCards[index];
  }
  
  return undefined;
};

export const deleteDocument = (id: number): boolean => {
  const docIndex = documents.findIndex(d => d.id === id);
  if (docIndex !== -1) {
    documents.splice(docIndex, 1);
    return true;
  }
  
  const cardIndex = cueCards.findIndex(c => c.id === id);
  if (cardIndex !== -1) {
    cueCards.splice(cardIndex, 1);
    return true;
  }
  
  return false;
};

export const getDocumentById = (id: number): Document | undefined => {
  const doc = documents.find(d => d.id === id);
  if (doc) return doc;
  return cueCards.find(c => c.id === id);
};
