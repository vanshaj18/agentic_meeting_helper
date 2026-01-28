import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CreateTemplateData, Agent, Document, Template } from '@shared/types';

interface CreateTemplateModalProps {
  template?: Template | null;
  onClose: () => void;
  onCreate: (data: CreateTemplateData) => void;
  onUpdate?: (data: CreateTemplateData) => void;
  agents: Agent[];
  documents: Document[];
  cueCards: Document[];
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  template,
  onClose,
  onCreate,
  onUpdate,
  agents,
  documents,
  cueCards,
}) => {
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: template?.name || '',
    meetingContext: template?.meetingContext || '',
    agentIds: template?.agentIds || [],
    documentIds: template?.documentIds || [],
    cueCardIds: template?.cueCardIds || [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        meetingContext: template.meetingContext,
        agentIds: template.agentIds || [],
        documentIds: template.documentIds || [],
        cueCardIds: template.cueCardIds || [],
      });
    } else {
      setFormData({
        name: '',
        meetingContext: '',
        agentIds: [],
        documentIds: [],
        cueCardIds: [],
      });
    }
  }, [template]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }
    if (template && onUpdate) {
      onUpdate(formData);
    } else {
      onCreate(formData);
    }
  };

  const toggleAgent = (agentId: number) => {
    setFormData((prev) => ({
      ...prev,
      agentIds: prev.agentIds.includes(agentId)
        ? prev.agentIds.filter((id) => id !== agentId)
        : [...prev.agentIds, agentId],
    }));
  };

  const toggleDocument = (docId: number) => {
    setFormData((prev) => ({
      ...prev,
      documentIds: prev.documentIds.includes(docId)
        ? prev.documentIds.filter((id) => id !== docId)
        : [...prev.documentIds, docId],
    }));
  };

  const toggleCueCard = (cardId: number) => {
    setFormData((prev) => ({
      ...prev,
      cueCardIds: prev.cueCardIds.includes(cardId)
        ? prev.cueCardIds.filter((id) => id !== cardId)
        : [...prev.cueCardIds, cardId],
    }));
  };

  return (
    <div 
      className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-ivory rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-red-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-5 border-b-2 border-red-600 flex items-center justify-between sticky top-0 bg-ivory z-10">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">{template ? 'Edit Template' : 'Create Template'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-lg flex-shrink-0 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-3 md:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Template Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              placeholder="Enter template name"
              className={`w-full px-3 md:px-4 py-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 ${
                error ? 'focus:ring-red-500' : 'focus:ring-red-600'
              } text-sm md:text-base`}
            />
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Meeting Context</label>
            <textarea
              value={formData.meetingContext}
              onChange={(e) => setFormData({ ...formData, meetingContext: e.target.value })}
              placeholder="Describe the meeting context, purpose, goals, agenda, participants..."
              rows={4}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 resize-none text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Add Agents</label>
            <div className="border border-gray-300 rounded-lg p-2 md:p-3 max-h-48 overflow-y-auto">
              {agents.length === 0 ? (
                <p className="text-sm text-gray-500">No agents available</p>
              ) : (
                <div className="space-y-1.5">
                  {agents.map((agent) => (
                    <label
                      key={agent.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.agentIds.includes(agent.id)}
                        onChange={() => toggleAgent(agent.id)}
                        className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-600 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-900">{agent.name}</span>
                        <p className="text-xs text-gray-500">{agent.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Add Documents</label>
            <div className="border border-gray-300 rounded-lg p-2 md:p-3 max-h-48 overflow-y-auto">
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500">No documents available</p>
              ) : (
                <div className="space-y-1.5">
                  {documents.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.documentIds.includes(doc.id)}
                        onChange={() => toggleDocument(doc.id)}
                        className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-600 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-900">{doc.title}</span>
                        <p className="text-xs text-gray-500">{doc.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Add Cue Cards</label>
            <div className="border border-gray-300 rounded-lg p-2 md:p-3 max-h-48 overflow-y-auto">
              {cueCards.length === 0 ? (
                <p className="text-sm text-gray-500">No cue cards available</p>
              ) : (
                <div className="space-y-1.5">
                  {cueCards.map((card) => (
                    <label
                      key={card.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.cueCardIds.includes(card.id)}
                        onChange={() => toggleCueCard(card.id)}
                        className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-600 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-900">{card.title}</span>
                        <p className="text-xs text-gray-500">{card.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5 border-t-2 border-red-600 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-ivory">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm md:text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm md:text-base"
          >
            {template ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
