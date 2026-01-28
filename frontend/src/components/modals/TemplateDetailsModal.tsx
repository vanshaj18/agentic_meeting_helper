import React from 'react';
import { X } from 'lucide-react';
import { Template } from '@shared/types';

interface TemplateDetailsModalProps {
  template: Template;
  onClose: () => void;
  agentNames?: string[];
  documentNames?: string[];
  cueCardNames?: string[];
}

const TemplateDetailsModal: React.FC<TemplateDetailsModalProps> = ({ 
  template, 
  onClose,
  agentNames = [],
  documentNames = [],
  cueCardNames = []
}) => {
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
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Template Details</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-lg flex-shrink-0 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Template Name</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900">{template.name}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Description</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
              <p className="text-gray-900 whitespace-pre-wrap text-sm">{template.meetingContext}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Agents</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900">
                {agentNames.length > 0 ? agentNames.join(', ') : 'No agents'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Documents</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900">
                {documentNames.length > 0 ? documentNames.join(', ') : 'No documents'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Cue Cards</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900">
                {cueCardNames.length > 0 ? cueCardNames.join(', ') : 'No cue cards'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5 border-t-2 border-red-600 sticky bottom-0 bg-ivory">
          <button
            onClick={onClose}
            className="w-full px-4 md:px-6 py-2 md:py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm md:text-base font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetailsModal;
