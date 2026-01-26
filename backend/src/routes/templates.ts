import express from 'express';
import { Template, CreateTemplateData } from '../../../shared/types';
import { getTemplates, createTemplate, getTemplateById, updateTemplate, deleteTemplate } from '../services/templateService';

const router = express.Router();

// Get all templates
router.get('/', (req, res) => {
  try {
    const templates = getTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get template by ID
router.get('/:id', (req, res) => {
  try {
    const template = getTemplateById(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create new template
router.post('/', (req, res) => {
  try {
    const templateData: CreateTemplateData = req.body;
    const newTemplate = createTemplate(templateData);
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const updates = req.body;
    const updatedTemplate = updateTemplate(templateId, updates);
    if (!updatedTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(updatedTemplate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const deleted = deleteTemplate(templateId);
    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
