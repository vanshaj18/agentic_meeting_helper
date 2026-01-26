import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Document } from '@shared/types';

interface EditDocumentModalProps {
  document: Document;
  onClose: () => void;
  onUpdate: (data: { title: string; description: string }) => void;
}

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({ document, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: document.title,
    description: document.description,
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      return;
    }
    onUpdate(formData);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg md:text-xl font-bold">Edit Document</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Document Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a description to help AI use this file effectively in meetings. More detail means better answers."
              rows={6}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
            />
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
          >
            Update Document
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDocumentModal;
