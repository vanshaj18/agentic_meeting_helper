import express from 'express';
import { Document, UploadDocumentData } from '../../../shared/types';
import { getDocuments, createDocument, createCueCard, updateDocument, deleteDocument } from '../services/documentService';

const router = express.Router();

// Get all documents
router.get('/', (req, res) => {
  try {
    const type = req.query.type as 'document' | 'cuecard' | undefined;
    const documents = getDocuments(type);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Create new document
router.post('/', (req, res) => {
  try {
    const docData: UploadDocumentData = req.body;
    
    // Validate: Title is required
    if (!docData.title || !docData.title.trim()) {
      return res.status(400).json({ error: 'Document title is required' });
    }

    // Validate: File is required (for documents, file is needed for RAG ingestion)
    // Note: File is sent separately via FormData, so we check if it exists in the request
    // In a real implementation, you'd use multer to handle file uploads here
    // For now, we rely on frontend validation, but we can add backend validation too
    
    const type = req.query.type as 'document' | 'cuecard' | undefined;
    const newDoc = type === 'cuecard' 
      ? createCueCard(docData)
      : createDocument(docData);
    res.status(201).json(newDoc);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create document' });
  }
});

// Update document
router.put('/:id', (req, res) => {
  try {
    const docId = parseInt(req.params.id);
    const updates = req.body;
    const updatedDoc = updateDocument(docId, updates);
    if (!updatedDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(updatedDoc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document
router.delete('/:id', (req, res) => {
  try {
    const docId = parseInt(req.params.id);
    const deleted = deleteDocument(docId);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
