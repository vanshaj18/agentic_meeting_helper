import React, { useState, useEffect } from 'react';
import { X, ChevronDown, FileText, GraduationCap, ChevronUp, Bot, Loader2 } from 'lucide-react';
import { CreateSessionData, Agent, Document } from '@shared/types';
import { agentsAPI, documentsAPI } from '../../services/api';

interface CreateSessionModalProps {
  onClose: () => void;
  onCreate: (data: CreateSessionData) => void | Promise<void>;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState<CreateSessionData>({
    name: '',
    template: '',
    description: '',
    documents: '',
    cueCard: '',
    agentIds: [],
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    time: new Date().toTimeString().slice(0, 5), // Current time in HH:mm format
  });
  const [predefinedAgents, setPredefinedAgents] = useState<Agent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cueCards, setCueCards] = useState<Document[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [selectedCueCardIds, setSelectedCueCardIds] = useState<number[]>([]);
  const [showDocumentsDropdown, setShowDocumentsDropdown] = useState(false);
  const [showCueCardsDropdown, setShowCueCardsDropdown] = useState(false);
  const [showAgentsDropdown, setShowAgentsDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    agentsAPI.getAll('predefined').then(setPredefinedAgents).catch(console.error);
    documentsAPI.getAll('document').then(setDocuments).catch(console.error);
    documentsAPI.getAll('cuecard').then(setCueCards).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Session name is required');
      return;
    }
    if (isCreating) return; // Prevent double submission
    
    setIsCreating(true);
    setError('');
    
    try {
      // Convert selected IDs to comma-separated strings for backend
      const submitData: CreateSessionData = {
        ...formData,
        documents: selectedDocumentIds.length > 0 ? selectedDocumentIds.join(',') : '',
        cueCard: selectedCueCardIds.length > 0 ? selectedCueCardIds.join(',') : '',
      };
      
      await onCreate(submitData);
      // If onCreate succeeds, modal will be closed by parent component
    } catch (error) {
      setError('Failed to create session. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-bg-primary rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-2 border-accent-red"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-5 border-b-2 border-accent-red flex items-center justify-between sticky top-0 bg-bg-primary z-10">
          <h2 className="text-lg md:text-xl font-semibold text-text-primary">Create New Session</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-bg-gray-50 rounded-lg flex-shrink-0 transition-colors">
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-3 md:space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Session Name <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              placeholder="Enter session name"
              className={`w-full px-3 md:px-4 py-2 border ${
                error ? 'border-accent-red' : 'border-border-primary'
              } rounded-lg focus:outline-none focus:ring-2 ${
                error ? 'focus:ring-accent-red' : 'focus:ring-accent-red'
              } text-sm md:text-base`}
            />
            {error && <p className="text-accent-red text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Meeting Template</label>
            <div className="relative">
              <select
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                className="w-full px-3 md:px-4 py-2 border border-border-primary rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-accent-red text-sm md:text-base"
              >
                <option value="">-- Select a template --</option>
                <option value="sales">Sales Meeting</option>
                <option value="standup">Daily Standup</option>
                <option value="review">Review Meeting</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 md:top-3 w-4 md:w-5 h-4 md:h-5 text-text-tertiary pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed info like purpose, goals, agenda, participants or any additional info. More detail will mean better answers."
              rows={6}
                className="w-full px-3 md:px-4 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-red resize-none text-sm md:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 md:px-4 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-red text-sm md:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 md:px-4 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-red text-sm md:text-base"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowDocumentsDropdown(!showDocumentsDropdown)}
              className="w-full flex items-center justify-between p-3 border-2 border-border-primary rounded-lg hover:bg-bg-secondary transition-colors text-left hover:border-accent-red"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm font-medium text-text-primary">
                  Documents
                  {selectedDocumentIds.length > 0 && (
                    <span className="ml-2 text-xs text-text-secondary">({selectedDocumentIds.length} selected)</span>
                  )}
                </span>
              </div>
              {showDocumentsDropdown ? (
                <ChevronUp className="w-4 h-4 text-text-tertiary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-tertiary" />
              )}
            </button>
            {showDocumentsDropdown && (
              <div className="mt-2 border-2 border-accent-red rounded-lg p-2 md:p-3 max-h-48 overflow-y-auto">
                {documents.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No documents available</p>
                ) : (
                  <div className="space-y-1.5">
                    {documents.map((doc) => (
                      <label
                        key={doc.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-bg-bg-gray-50 p-1.5 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocumentIds.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocumentIds([...selectedDocumentIds, doc.id]);
                            } else {
                              setSelectedDocumentIds(selectedDocumentIds.filter((id) => id !== doc.id));
                            }
                          }}
                          className="w-4 h-4 text-text-primary rounded focus:ring-2 focus:ring-accent-primary border-border-primary flex-shrink-0"
                        />
                        <FileText className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-text-primary block truncate">{doc.title}</span>
                          {doc.description && doc.description !== 'No description' && (
                            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{doc.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowCueCardsDropdown(!showCueCardsDropdown)}
              className="w-full flex items-center justify-between p-3 border-2 border-border-primary rounded-lg hover:bg-bg-secondary transition-colors text-left hover:border-accent-red"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm font-medium text-text-primary">
                  Cue Cards
                  {selectedCueCardIds.length > 0 && (
                    <span className="ml-2 text-xs text-text-secondary">({selectedCueCardIds.length} selected)</span>
                  )}
                </span>
              </div>
              {showCueCardsDropdown ? (
                <ChevronUp className="w-4 h-4 text-text-tertiary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-tertiary" />
              )}
            </button>
            {showCueCardsDropdown && (
              <div className="mt-2 border-2 border-accent-red rounded-lg p-2 md:p-3 max-h-48 overflow-y-auto">
                {cueCards.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No cue cards available</p>
                ) : (
                  <div className="space-y-1.5">
                    {cueCards.map((card) => (
                      <label
                        key={card.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-bg-bg-gray-50 p-1.5 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCueCardIds.includes(card.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCueCardIds([...selectedCueCardIds, card.id]);
                            } else {
                              setSelectedCueCardIds(selectedCueCardIds.filter((id) => id !== card.id));
                            }
                          }}
                          className="w-4 h-4 text-text-primary rounded focus:ring-2 focus:ring-accent-primary border-border-primary flex-shrink-0"
                        />
                        <GraduationCap className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-text-primary block truncate">{card.title}</span>
                          {card.description && card.description !== 'No description' && (
                            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{card.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAgentsDropdown(!showAgentsDropdown)}
              className="w-full flex items-center justify-between p-3 border-2 border-border-primary rounded-lg hover:bg-bg-secondary transition-colors text-left hover:border-accent-red"
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm font-medium text-text-primary">
                  AI Agents
                  {formData.agentIds && formData.agentIds.length > 0 && (
                    <span className="ml-2 text-xs text-text-secondary">({formData.agentIds.length} selected)</span>
                  )}
                </span>
              </div>
              {showAgentsDropdown ? (
                <ChevronUp className="w-4 h-4 text-text-tertiary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-tertiary" />
              )}
            </button>
            {showAgentsDropdown && (
              <div className="mt-2 border-2 border-accent-red rounded-lg p-2 md:p-3 max-h-64 overflow-y-auto">
                <div className="text-xs font-medium text-text-secondary mb-2 sticky top-0 bg-bg-primary pb-1.5">DEFAULT AGENTS</div>
                {predefinedAgents.length === 0 ? (
                  <p className="text-sm text-text-tertiary">Loading agents...</p>
                ) : (
                  <div className="space-y-1.5">
                    {predefinedAgents.map((agent) => (
                      <label
                        key={agent.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-bg-bg-gray-50 p-1.5 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.agentIds?.includes(agent.id) || false}
                          onChange={(e) => {
                            const currentIds = formData.agentIds || [];
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                agentIds: [...currentIds, agent.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                agentIds: currentIds.filter((id) => id !== agent.id),
                              });
                            }
                          }}
                          className="w-4 h-4 text-text-primary rounded focus:ring-2 focus:ring-accent-primary border-border-primary flex-shrink-0"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-text-primary">{agent.name}</span>
                          {agent.description && (
                            <p className="text-xs text-text-tertiary mt-0.5">{agent.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-5 border-t-2 border-accent-red flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-bg-primary">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-2.5 border border-border-primary text-text-secondary rounded-lg hover:bg-bg-bg-gray-50 hover:border-border-secondary transition-colors text-sm md:text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating}
            className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-2.5 bg-accent-primary text-text-text-white rounded-lg hover:bg-accent-primary-hover transition-all duration-200 font-medium text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isCreating ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSessionModal;
