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
    const type = req.query.type as 'document' | 'cuecard' | undefined;
    const newDoc = type === 'cuecard' 
      ? createCueCard(docData)
      : createDocument(docData);
    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document' });
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
