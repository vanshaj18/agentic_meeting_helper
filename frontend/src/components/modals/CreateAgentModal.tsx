import React, { useState } from 'react';
import { X, Shield } from 'lucide-react';
import { Agent, CreateAgentData } from '@shared/types';

interface CreateAgentModalProps {
  agent?: Agent | null;
  onClose: () => void;
  onCreate: (data: CreateAgentData) => void;
  onUpdate: (data: CreateAgentData) => void;
}

const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  agent,
  onClose,
  onCreate,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<CreateAgentData>({
    name: agent?.name || '',
    description: agent?.description || '',
    tags: agent?.tags?.join(', ') || '',
    prompt: agent?.prompt || '',
    guardrails: agent?.guardrails || '',
  });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setError('Agent name is required');
      return;
    }
    if (agent) {
      onUpdate(formData);
    } else {
      onCreate(formData);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">{agent ? 'Edit Agent' : 'Create Agent'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-lg flex-shrink-0 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Agent Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              placeholder="e.g., Sales Pitch Assistant"
              className={`w-full px-3 md:px-4 py-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 ${
                error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
              } text-sm md:text-base`}
            />
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this agent does"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Tag</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., Sales, Business (comma-separated)"
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Agent Prompt</label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Define the agent's behavior, expertise, and how it should respond to queries..."
              rows={8}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Guardrails (Optional)</span>
              </div>
            </label>
            <textarea
              value={formData.guardrails}
              onChange={(e) => setFormData({ ...formData, guardrails: e.target.value })}
              placeholder="Define limitations, ethical guidelines, or constraints for the agent..."
              rows={4}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
            />
          </div>
        </div>

        <div className="p-5 md:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 md:px-6 py-2.5 md:py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm md:text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm md:text-base"
          >
            {agent ? 'Update Agent' : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAgentModal;
