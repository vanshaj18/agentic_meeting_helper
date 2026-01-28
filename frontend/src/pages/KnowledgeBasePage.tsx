import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import UploadDocumentModal from '../components/modals/UploadDocumentModal';
import EditDocumentModal from '../components/modals/EditDocumentModal';
import PDFViewerModal from '../components/modals/PDFViewerModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import { FileIcon, GraduationCap, Plus, MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { documentsAPI } from '../services/api';
import { Document, UploadDocumentData } from '@shared/types';
import { logger } from '../utils/logger';
import { indexedDBService } from '../services/indexedDBService';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Map<number, File>>(new Map());
  const [activeKBTab, setActiveKBTab] = useState<'documents' | 'cuecards'>(
    initialOptions?.knowledgeBaseTab || 'documents'
  );
  const [ingestionProgress, setIngestionProgress] = useState<{
    documentId: number | null;
    progress: number;
    label: string | null;
    message?: string;
  }>({ documentId: null, progress: 0, label: null, message: undefined });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (initialOptions?.openModal === 'uploadDocument') {
      setShowUploadModal(true);
    }
  }, [initialOptions]);
  const [showDocMenu, setShowDocMenu] = useState<number | null>(null);
  const { documents, cueCards, selectedDocument, setDocuments, setCueCards, setSelectedDocument } =
    useAppContext();

  useEffect(() => {
    // Initialize IndexedDB
    indexedDBService.init().catch((error) => {
      console.error('Failed to initialize IndexedDB:', error);
    });

    // Load documents from API and IndexedDB
    const loadDocuments = async () => {
      try {
        // Fetch API documents
        const apiDocuments = await documentsAPI.getAll('document');
        const apiCueCards = await documentsAPI.getAll('cuecard');

        // Fetch IndexedDB document metadata
        const indexedDBDocs = await indexedDBService.getAllDocumentMetadata('default-user');
        
        // Convert IndexedDB documents to Document format
        const indexedDBDocuments: Document[] = indexedDBDocs
          .filter((meta) => {
            // Only include documents that don't already exist in API documents
            return !apiDocuments.some((doc) => doc.id === meta.documentId);
          })
          .map((meta) => ({
            id: meta.documentId,
            title: meta.title,
            description: meta.summary || 'No description',
            label: meta.label,
            type: 'document' as const,
            fileUrl: undefined,
            fileName: undefined,
          }));

        // Merge API documents with IndexedDB documents
        const allDocuments = [...apiDocuments, ...indexedDBDocuments];
        setDocuments(allDocuments);
        setCueCards(apiCueCards);
      } catch (error) {
        console.error('Failed to load documents:', error);
        // Fallback to API only
        documentsAPI.getAll('document').then(setDocuments).catch(console.error);
        documentsAPI.getAll('cuecard').then(setCueCards).catch(console.error);
      }
    };

    loadDocuments();
  }, [setDocuments, setCueCards]);

  const currentItems = activeKBTab === 'documents' ? documents : cueCards;

  const handleUploadDocument = async (docData: UploadDocumentData) => {
    // Validate: No file means no document creation
    if (!docData.file) {
      console.error('Cannot create document without a PDF file');
      return;
    }

    // Validate file type
    if (docData.file.type !== 'application/pdf' && !docData.file.name.toLowerCase().endsWith('.pdf')) {
      console.error('Invalid file type. Only PDF files are allowed.');
      return;
    }

    try {
      const docType = activeKBTab === 'documents' ? 'document' : 'cuecard';
      const newDoc = await documentsAPI.create(docData, docType);
      
      // Store the file for PDF viewing
      setUploadedFiles((prev) => new Map(prev).set(newDoc.id, docData.file!));
      
      if (activeKBTab === 'documents') {
        setDocuments([...documents, newDoc]);
      } else {
        setCueCards([...cueCards, newDoc]);
      }
      setShowUploadModal(false);

      // Trigger RAG ingestion for documents (not cue cards)
      // Only ingest if file exists (already validated above)
      if (activeKBTab === 'documents') {
        await triggerRAGIngestion(newDoc.id, docData.file, newDoc.title);
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const triggerRAGIngestion = async (documentId: number, file: File, documentTitle: string) => {
    try {
      setIngestionProgress({ documentId, progress: 0, label: null, message: undefined });
      
      // Check file size to determine storage method
      const FILE_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB
      const useIndexedDB = file.size < FILE_SIZE_THRESHOLD;

      if (useIndexedDB) {
        // Client-side ingestion for small files (< 5MB) - NEW WORKFLOW
        logger.rag('Using client-side IndexedDB storage (new workflow)', {
          documentId,
          fileSize: file.size,
        });

        try {
          setIngestionProgress({ documentId, progress: 0, label: null, message: 'Initializing...' });

          // Import and use new client-side ingestion function
          const { ingestDocumentClient } = await import('../services/clientRAGService');
          
          const result = await ingestDocumentClient(
            documentId,
            'default-user',
            file,
            documentTitle,
            (current, total, message) => {
              // Update progress with real-time status
              const progress = Math.floor((current / total) * 100);
              setIngestionProgress({ 
                documentId, 
                progress: Math.min(progress, 99), 
                label: null,
                message: message || 'Processing...'
              });
              logger.rag('Ingestion progress', { documentId, progress, message });
            }
          );

          if (!result.success) {
            throw new Error(result.error || 'Client-side ingestion failed');
          }

          // Update document with label and description (summary)
          setIngestionProgress({ documentId, progress: 95, label: null, message: 'Updating document metadata...' });
          if (result.label || result.summary) {
            try {
              const updateData: { label?: string; description?: string } = {};
              if (result.label) updateData.label = result.label;
              if (result.summary) updateData.description = result.summary;
              
              const updatedDoc = await documentsAPI.update(documentId, updateData);
              if (activeKBTab === 'documents') {
                setDocuments(documents.map((d) => (d.id === documentId ? updatedDoc : d)));
              }
            } catch (error) {
              // If API update fails, still update local state with IndexedDB metadata
              const indexedDBMeta = await indexedDBService.getDocumentMetadata(documentId);
              if (indexedDBMeta && activeKBTab === 'documents') {
                const indexedDBDoc: Document = {
                  id: indexedDBMeta.documentId,
                  title: indexedDBMeta.title,
                  description: indexedDBMeta.summary || result.summary || 'No description',
                  label: indexedDBMeta.label || result.label,
                  type: 'document',
                };
                // Update or add the document
                const existingIndex = documents.findIndex((d) => d.id === documentId);
                if (existingIndex >= 0) {
                  setDocuments(documents.map((d, idx) => idx === existingIndex ? indexedDBDoc : d));
                } else {
                  setDocuments([...documents, indexedDBDoc]);
                }
              }
            }
          }

          setIngestionProgress({ documentId, progress: 100, label: result.label, message: '✓ Stored in IndexedDB successfully!' });
          
          // Refresh documents list to include any IndexedDB-only documents
          try {
            const apiDocuments = await documentsAPI.getAll('document');
            const indexedDBDocs = await indexedDBService.getAllDocumentMetadata('default-user');
            const indexedDBDocuments: Document[] = indexedDBDocs
              .filter((meta) => !apiDocuments.some((doc) => doc.id === meta.documentId))
              .map((meta) => ({
                id: meta.documentId,
                title: meta.title,
                description: meta.summary || 'No description',
                label: meta.label,
                type: 'document' as const,
              }));
            setDocuments([...apiDocuments, ...indexedDBDocuments]);
          } catch (error) {
            console.error('Failed to refresh documents:', error);
          }
          
          // Clear progress after 3 seconds
          setTimeout(() => {
            setIngestionProgress({ documentId: null, progress: 0, label: null, message: undefined });
          }, 3000);
        } catch (error) {
          logger.ragError('Client-side ingestion failed', error as Error, { documentId });
          setIngestionProgress({ documentId: null, progress: 0, label: null });
          throw error;
        }
      } else {
        // Server-side Pinecone ingestion for large files (>= 5MB)
        logger.rag('Using server-side Pinecone storage', {
          documentId,
          fileSize: file.size,
        });

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setIngestionProgress((prev) => {
            if (prev.documentId === documentId && prev.progress < 90) {
              return { ...prev, progress: prev.progress + 10 };
            }
            return prev;
          });
        }, 500);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', 'default-user'); // TODO: Get from auth

        const response = await fetch(`http://localhost:3001/api/rag/ingest/${documentId}`, {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error('Server-side ingestion failed');
        }

        const result = await response.json();
        
        // Update document with label and description (summary)
        if (result.label || result.summary) {
          const updateData: { label?: string; description?: string } = {};
          if (result.label) updateData.label = result.label;
          if (result.summary) updateData.description = result.summary;
          
          const updatedDoc = await documentsAPI.update(documentId, updateData);
          if (activeKBTab === 'documents') {
            setDocuments(documents.map((d) => (d.id === documentId ? updatedDoc : d)));
          }
        }

        setIngestionProgress({ documentId, progress: 100, label: result.label, message: 'Storing in Pinecone...' });
        
        // Clear progress after 3 seconds
        setTimeout(() => {
          setIngestionProgress({ documentId: null, progress: 0, label: null, message: undefined });
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to ingest document:', error);
      setIngestionProgress({ documentId: null, progress: 0, label: null });
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

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
    setShowDocMenu(null);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete from IndexedDB if document is stored there
      try {
        const hasDoc = await indexedDBService.hasDocument(documentToDelete.id);
        if (hasDoc) {
          await indexedDBService.deleteDocumentChunks(documentToDelete.id);
          logger.rag('Deleted document chunks from IndexedDB', { documentId: documentToDelete.id });
        }
      } catch (error) {
        console.error('Failed to delete from IndexedDB:', error);
        // Continue with API deletion even if IndexedDB deletion fails
      }

      await documentsAPI.delete(documentToDelete.id);
      if (documentToDelete.type === 'document') {
        setDocuments(documents.filter((d) => d.id !== documentToDelete.id));
      } else {
        setCueCards(cueCards.filter((c) => c.id !== documentToDelete.id));
      }
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-ivory overflow-hidden">
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
                  ? 'bg-ivory text-gray-900 shadow-sm border-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-ivory-dark'
              }`}
            >
              <FileIcon className="w-4 h-4" />
              <span>Documents</span>
            </button>
            <button
              onClick={() => setActiveKBTab('cuecards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                activeKBTab === 'cuecards'
                  ? 'bg-ivory text-gray-900 shadow-sm border-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-ivory-dark'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Cue Card</span>
            </button>
          </div>

          <div className="bg-ivory rounded-xl border-2 border-red-600 shadow-sm">
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
                Qbot will use the files to provide instant, context-aware assistance during meetings.
              </p>
            </div>

            <div className="p-4 md:p-6">
              {currentItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No {activeKBTab === 'documents' ? 'documents' : 'cue cards'} yet</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 border-2 border-red-600"
                  >
                    Upload {activeKBTab === 'documents' ? 'Document' : 'Cue Card'}
                  </button>
                </div>
              ) : (
                currentItems.map((item, index) => (
                  <div
                    key={`${item.type}_${item.id}_${index}_${item.title}`}
                    className={`flex items-center justify-between p-4 hover:bg-ivory-dark rounded-lg border-2 border-gray-200 hover:border-red-600 mb-2 transition-colors ${
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
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-red-600">
                        <FileIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 text-sm">{item.title}</h3>
                        <p className="text-xs md:text-sm text-gray-400">{item.description}</p>
                        {item.label && (
                          <p className="text-xs text-red-600 mt-1 font-medium">Label: {item.label}</p>
                        )}
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
                          <div className="absolute right-0 top-10 w-48 bg-ivory rounded-lg shadow-lg border-2 border-red-600 py-2 z-20">
                            {activeKBTab === 'documents' && (
                              <button
                                onClick={() => handleViewPDF(item)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-ivory-dark"
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
                              onClick={() => handleDeleteClick(item)}
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

        {/* Ingestion Progress Bar */}
        {ingestionProgress.documentId && (
          <div className="fixed bottom-0 left-0 right-0 bg-ivory border-t-2 border-red-600 shadow-lg p-4 z-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse border border-red-600"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {ingestionProgress.message || 'Processing document...'}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{ingestionProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-black h-2 rounded-full transition-all duration-300 ease-out border border-red-600"
                  style={{ width: `${Math.min(ingestionProgress.progress, 100)}%` }}
                ></div>
              </div>
              {ingestionProgress.label && ingestionProgress.progress === 100 && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Ingestion complete! Label: {ingestionProgress.label}
                </p>
              )}
            </div>
          </div>
        )}
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

      {showDeleteModal && documentToDelete && (
        <DeleteConfirmModal
          title={`Delete ${activeKBTab === 'documents' ? 'Document' : 'Cue Card'}`}
          message={`Are you sure you want to delete "${documentToDelete.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteDocument}
          onCancel={() => {
            setShowDeleteModal(false);
            setDocumentToDelete(null);
            setIsDeleting(false);
          }}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default KnowledgeBasePage;
