import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import CreateTemplateModal from '../components/modals/CreateTemplateModal';
import { FileText, Plus, MoreVertical, Edit, Trash } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { templatesAPI, agentsAPI, documentsAPI } from '../services/api';
import { Template, CreateTemplateData, Agent, Document } from '@shared/types';

interface TemplatesPageProps {
  onNavigate: (page: string, options?: any) => void;
}

const TemplatesPage: React.FC<TemplatesPageProps> = ({ onNavigate }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [allCueCards, setAllCueCards] = useState<Document[]>([]);
  const [showTemplateMenu, setShowTemplateMenu] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const { documents, cueCards } = useAppContext();

  useEffect(() => {
    templatesAPI.getAll().then(setTemplates).catch(console.error);
    agentsAPI.getAll('predefined').then((predefined) => {
      agentsAPI.getAll('my').then((my) => {
        setAllAgents([...predefined, ...my]);
      });
    });
    documentsAPI.getAll('document').then(setAllDocuments).catch(console.error);
    documentsAPI.getAll('cuecard').then(setAllCueCards).catch(console.error);
  }, []);

  const handleCreateTemplate = async (templateData: CreateTemplateData) => {
    try {
      const newTemplate = await templatesAPI.create(templateData);
      setTemplates([...templates, newTemplate]);
      setShowCreateModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleUpdateTemplate = async (templateData: CreateTemplateData) => {
    if (!selectedTemplate) return;
    try {
      const updatedTemplate = await templatesAPI.update(selectedTemplate.id, templateData);
      setTemplates(templates.map((t) => (t.id === selectedTemplate.id ? updatedTemplate : t)));
      setShowCreateModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowCreateModal(true);
    setShowTemplateMenu(null);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await templatesAPI.delete(templateId);
      setTemplates(templates.filter((t) => t.id !== templateId));
      setShowTemplateMenu(null);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const getAgentNames = (agentIds: number[]): string => {
    const names = agentIds
      .map((id) => allAgents.find((a) => a.id === id)?.name)
      .filter(Boolean) as string[];
    return names.length > 0 ? names.join(', ') : 'No agents';
  };

  const getDocumentNames = (docIds: number[]): string => {
    const names = docIds
      .map((id) => allDocuments.find((d) => d.id === id)?.title)
      .filter(Boolean) as string[];
    return names.length > 0 ? names.join(', ') : 'No documents';
  };

  const getCueCardNames = (cardIds: number[]): string => {
    const names = cardIds
      .map((id) => allCueCards.find((c) => c.id === id)?.title)
      .filter(Boolean) as string[];
    return names.length > 0 ? names.join(', ') : 'No cue cards';
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentPage="templates"
        showMobileMenu={showMobileMenu}
        onCloseMobileMenu={() => setShowMobileMenu(false)}
        onNavigate={onNavigate}
      />

      <div className="flex-1 overflow-auto">
        <MobileHeader
          title="Templates"
          onMenuClick={() => setShowMobileMenu(true)}
          onActionClick={() => setShowCreateModal(true)}
        />

        <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
          <div className="mb-8 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Meeting Templates</h1>
            <p className="text-sm md:text-base text-gray-400">(create reusable templates)</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-5 md:p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-900">My templates</h2>
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                    ?
                  </div>
                </div>
                <div className="text-xs md:text-sm text-gray-400 sm:hidden">
                  (create/manage your templates)
                </div>
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setShowCreateModal(true);
                  }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create Template
                </button>
              </div>
              <p className="text-xs md:text-sm text-gray-400 mt-2 hidden sm:block">
                (create/manage your templates)
              </p>
            </div>

            <div className="p-4 md:p-6">
              {templates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="mb-2 font-medium">No templates yet</p>
                  <p className="text-sm mb-4">Create your first template to get started.</p>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Template
                  </button>
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start justify-between p-4 hover:bg-gray-50/50 rounded-lg border border-gray-100 mb-2 cursor-pointer transition-colors"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-50/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 text-sm">{template.name}</h3>
                        {template.meetingContext && (
                          <p className="text-xs md:text-sm text-gray-400 mb-2">
                            {template.meetingContext}
                          </p>
                        )}
                        <div className="flex flex-col gap-1 text-xs md:text-sm text-gray-400">
                          <span>
                            <strong className="text-gray-500">Agents:</strong> {getAgentNames(template.agentIds)}
                          </span>
                          <span>
                            <strong className="text-gray-500">Documents:</strong> {getDocumentNames(template.documentIds)}
                          </span>
                          <span>
                            <strong className="text-gray-500">Cue Cards:</strong> {getCueCardNames(template.cueCardIds)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() =>
                          setShowTemplateMenu(showTemplateMenu === template.id ? null : template.id)
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                      {showTemplateMenu === template.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowTemplateMenu(null)}
                          />
                          <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                            <button
                              onClick={() => handleEditTemplate(template)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
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

      {showCreateModal && (
        <CreateTemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTemplate(null);
          }}
          onCreate={handleCreateTemplate}
          onUpdate={handleUpdateTemplate}
          agents={allAgents}
          documents={allDocuments}
          cueCards={allCueCards}
        />
      )}
    </div>
  );
};

export default TemplatesPage;
