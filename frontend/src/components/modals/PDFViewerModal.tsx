import React, { useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { Document } from '@shared/types';

interface PDFViewerModalProps {
  document: Document;
  fileUrl?: string;
  file?: File | null;
  onClose: () => void;
}

const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ document, fileUrl, file, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      // Create object URL from File object
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      return () => {
        // Cleanup object URL when component unmounts
        URL.revokeObjectURL(url);
      };
    } else if (fileUrl) {
      setPdfUrl(fileUrl);
    } else {
      setError('No PDF file available to display');
    }
  }, [file, fileUrl]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = window.document.createElement('a');
      link.href = pdfUrl;
      link.download = `${document.title}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{document.title}</h2>
              {document.description && (
                <p className="text-xs md:text-sm text-gray-500 truncate">{document.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {pdfUrl && (
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 mb-2">{error}</p>
              <p className="text-sm text-gray-500">
                Please ensure the PDF file is available and try again.
              </p>
            </div>
          ) : pdfUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <iframe
                src={pdfUrl}
                className="w-full h-full min-h-[600px] border border-gray-300 rounded-lg bg-white"
                title={`PDF Viewer - ${document.title}`}
                style={{ maxHeight: 'calc(90vh - 120px)' }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewerModal;
