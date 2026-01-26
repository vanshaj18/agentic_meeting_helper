import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import UploadDocumentModal from '../components/modals/UploadDocumentModal';
import EditDocumentModal from '../components/modals/EditDocumentModal';
import PDFViewerModal from '../components/modals/PDFViewerModal';
import { FileIcon, GraduationCap, Plus, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { documentsAPI } from '../services/api';
import { Document, UploadDocumentData } from '@shared/types';

interface KnowledgeBasePageProps {
  onNavigate: (page: string, options?: any) => void;
  initialOptions?: {
    knowledgeBaseTab?: 'documents' | 'cuecards';
    openModal?: 'uploadDocument';
  };
}

const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({ onNavigate, initialOptions }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Map<number, File>>(new Map());
  const [activeKBTab, setActiveKBTab] = useState<'documents' | 'cuecards'>(
    initialOptions?.knowledgeBaseTab || 'documents'
  );

  useEffect(() => {
    if (initialOptions?.openModal === 'uploadDocument') {
      setShowUploadModal(true);
    }
  }, [initialOptions]);
  const [showDocMenu, setShowDocMenu] = useState<number | null>(null);
  const { documents, cueCards, selectedDocument, setDocuments, setCueCards, setSelectedDocument } =
    useAppContext();

  useEffect(() => {
    documentsAPI.getAll('document').then(setDocuments).catch(console.error);
    documentsAPI.getAll('cuecard').then(setCueCards).catch(console.error);
  }, [setDocuments, setCueCards]);

  const currentItems = activeKBTab === 'documents' ? documents : cueCards;

  const handleUploadDocument = async (docData: UploadDocumentData) => {
    try {
      const docType = activeKBTab === 'documents' ? 'document' : 'cuecard';
      const newDoc = await documentsAPI.create(docData, docType);
      
      // Store the file for PDF viewing
      if (docData.file) {
        setUploadedFiles((prev) => new Map(prev).set(newDoc.id, docData.file!));
      }
      
      if (activeKBTab === 'documents') {
        setDocuments([...documents, newDoc]);
      } else {
        setCueCards([...cueCards, newDoc]);
      }
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleViewPDF = (doc: Document) => {
    setViewingDocument(doc);
    setShowPDFViewer(true);
    setShowDocMenu(null);
  };

  const handleEditDocument = async (docData: { title: string; description: string }) => {
    if (!selectedDocument) return;
    try {
      const updatedDoc = await documentsAPI.update(selectedDocument.id, docData);
      if (selectedDocument.type === 'document') {
        setDocuments(documents.map((doc) => (doc.id === selectedDocument.id ? updatedDoc : doc)));
      } else {
        setCueCards(cueCards.map((card) => (card.id === selectedDocument.id ? updatedDoc : card)));
      }
      setShowEditModal(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    try {
      await documentsAPI.delete(doc.id);
      if (doc.type === 'document') {
        setDocuments(documents.filter((d) => d.id !== doc.id));
      } else {
        setCueCards(cueCards.filter((c) => c.id !== doc.id));
      }
      setShowDocMenu(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentPage="knowledge-base"
        showMobileMenu={showMobileMenu}
        onCloseMobileMenu={() => setShowMobileMenu(false)}
        onNavigate={onNavigate}
      />

      <div className="flex-1 overflow-auto">
        <MobileHeader
          title="Knowledge Base"
          onMenuClick={() => setShowMobileMenu(true)}
          onActionClick={() => setShowUploadModal(true)}
        />

        <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
          <div className="mb-8 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Knowledge Base</h1>
            <p className="text-sm md:text-base text-gray-400">
              Store and manage all your prep materials in one place
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveKBTab('documents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                activeKBTab === 'documents'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileIcon className="w-4 h-4" />
              <span>Documents</span>
            </button>
            <button
              onClick={() => setActiveKBTab('cuecards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                activeKBTab === 'cuecards'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Cue Card</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-5 md:p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-900">
                    {activeKBTab === 'documents' ? 'Document Library' : 'Cue Card Library'}
                  </h2>
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                    ?
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Upload {activeKBTab === 'documents' ? 'Document' : 'Cue Card'}
                </button>
              </div>
              <p className="text-xs md:text-sm text-gray-400 mt-2">
                JarWiz will use the files to provide instant, context-aware assistance during meetings.
              </p>
            </div>

            <div className="p-4 md:p-6">
              {currentItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No {activeKBTab === 'documents' ? 'documents' : 'cue cards'} yet</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Upload {activeKBTab === 'documents' ? 'Document' : 'Cue Card'}
                  </button>
                </div>
              ) : (
                currentItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 hover:bg-gray-50/50 rounded-lg border border-gray-100 mb-2 transition-colors ${
                      activeKBTab === 'documents' ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      // Only open PDF viewer for documents, not cue cards
                      if (activeKBTab === 'documents') {
                        handleViewPDF(item);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-50/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 text-sm">{item.title}</h3>
                        <p className="text-xs md:text-sm text-gray-400">{item.description}</p>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setShowDocMenu(showDocMenu === item.id ? null : item.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                      {showDocMenu === item.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowDocMenu(null)}
                          />
                          <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                            {activeKBTab === 'documents' && (
                              <button
                                onClick={() => handleViewPDF(item)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="w-4 h-4" />
                                View PDF
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedDocument(item);
                                setShowEditModal(true);
                                setShowDocMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(item)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <UploadDocumentModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadDocument}
          type={activeKBTab}
        />
      )}

      {showEditModal && selectedDocument && (
        <EditDocumentModal
          document={selectedDocument}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDocument(null);
          }}
          onUpdate={handleEditDocument}
        />
      )}

      {showPDFViewer && viewingDocument && (
        <PDFViewerModal
          document={viewingDocument}
          file={uploadedFiles.get(viewingDocument.id) || null}
          fileUrl={viewingDocument.fileUrl}
          onClose={() => {
            setShowPDFViewer(false);
            setViewingDocument(null);
          }}
        />
      )}
    </div>
  );
};

export default KnowledgeBasePage;
