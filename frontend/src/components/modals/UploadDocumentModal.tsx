import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { UploadDocumentData } from '@shared/types';

interface UploadDocumentModalProps {
  onClose: () => void;
  onUpload: (data: UploadDocumentData) => void;
  type: 'documents' | 'cuecards';
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({ onClose, onUpload, type }) => {
  const [formData, setFormData] = useState<UploadDocumentData>({
    title: '',
    description: '',
    file: null,
  });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      setError('Document title is required');
      return;
    }
    onUpload(formData);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Upload {type === 'documents' ? 'Document' : 'Cue Card'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-lg flex-shrink-0 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Document Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setError('');
              }}
              placeholder="Enter document title"
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
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a description to help AI use this file effectively in meetings. More detail means better answers."
              rows={6}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Select PDF File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  setFormData({ ...formData, file: e.target.files?.[0] || null })
                }
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 mb-1">
                  {formData.file ? formData.file.name : 'Click to choose file or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">PDF files only</p>
              </label>
            </div>
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
            className="w-full sm:flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm md:text-base flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload {type === 'documents' ? 'Document' : 'Cue Card'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentModal;
