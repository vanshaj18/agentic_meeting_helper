import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  return (
    <div
      className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <div
        className="bg-ivory rounded-2xl w-full max-w-md shadow-2xl border-2 border-red-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-gray-50 rounded-lg flex-shrink-0 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full sm:flex-1 px-4 py-2 md:py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:flex-1 px-4 py-2 md:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
