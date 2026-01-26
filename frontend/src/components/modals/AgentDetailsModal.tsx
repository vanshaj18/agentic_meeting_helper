import React from 'react';
import { X, Shield } from 'lucide-react';
import { Agent } from '@shared/types';

interface AgentDetailsModalProps {
  agent: Agent;
  onClose: () => void;
}

const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({ agent, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg md:text-xl font-bold">Agent Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900">{agent.name}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900">{agent.description}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900">
                {agent.tags.length > 0 ? agent.tags.join(', ') : 'No tag'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agent Prompt</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
              <p className="text-gray-900 whitespace-pre-wrap text-sm">{agent.prompt}</p>
            </div>
          </div>

          {agent.guardrails && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Guardrails
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap text-sm">{agent.guardrails}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full px-4 md:px-6 py-2 md:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentDetailsModal;
