import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import CreateAgentModal from '../components/modals/CreateAgentModal';
import AgentDetailsModal from '../components/modals/AgentDetailsModal';
import { Bot, Store, Plus, MoreVertical, Edit, Trash, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { agentsAPI } from '../services/api';
import { Agent, CreateAgentData } from '@shared/types';
import { logger } from '../utils/logger';

interface AgentStorePageProps {
  onNavigate: (page: string, options?: any) => void;
  initialOptions?: {
    agentTab?: 'predefined' | 'my';
  };
}

const AgentStorePage: React.FC<AgentStorePageProps> = ({ onNavigate, initialOptions }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [showAgentDetailsModal, setShowAgentDetailsModal] = useState(false);
  const [activeAgentTab, setActiveAgentTab] = useState<'predefined' | 'my'>(
    initialOptions?.agentTab || 'predefined'
  );
  const [showAgentMenu, setShowAgentMenu] = useState<number | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<number | null>(null);
  const {
    predefinedAgents,
    myAgents,
    selectedAgent,
    setPredefinedAgents,
    setMyAgents,
    setSelectedAgent,
  } = useAppContext();

  useEffect(() => {
    logger.agent('Agent store page loaded', { activeTab: activeAgentTab });
    agentsAPI.getAll('predefined')
      .then((agents) => {
        setPredefinedAgents(agents);
        logger.agent('Predefined agents fetched', { count: agents.length });
      })
      .catch((error) => {
        logger.agentError('Failed to fetch predefined agents', error);
      });
    agentsAPI.getAll('my')
      .then((agents) => {
        setMyAgents(agents);
        logger.agent('My agents fetched', { count: agents.length });
      })
      .catch((error) => {
        logger.agentError('Failed to fetch my agents', error);
      });
  }, [setPredefinedAgents, setMyAgents, activeAgentTab]);

  const currentAgents = activeAgentTab === 'predefined' ? predefinedAgents : myAgents;

  const handleCreateAgent = async (agentData: CreateAgentData) => {
    logger.agent('Creating new agent', { name: agentData.name });
    try {
      const newAgent = await agentsAPI.create(agentData);
      setMyAgents([...myAgents, newAgent]);
      setShowCreateAgentModal(false);
      logger.agent('Agent created successfully', { agentId: newAgent.id, name: newAgent.name });
    } catch (error) {
      logger.agentError('Failed to create agent', error as Error, { name: agentData.name });
    }
  };

  const handleEditAgent = async (agentData: CreateAgentData) => {
    if (!selectedAgent) return;
    logger.agent('Updating agent', { agentId: selectedAgent.id, name: agentData.name });
    try {
      const updatedAgent = await agentsAPI.update(selectedAgent.id, agentData);
      setMyAgents(myAgents.map((agent) => (agent.id === selectedAgent.id ? updatedAgent : agent)));
      setShowCreateAgentModal(false);
      setSelectedAgent(null);
      logger.agent('Agent updated successfully', { agentId: selectedAgent.id });
    } catch (error) {
      logger.agentError('Failed to update agent', error as Error, { agentId: selectedAgent.id });
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    setDeletingAgentId(agent.id);
    logger.agent('Deleting agent', { agentId: agent.id, name: agent.name });
    try {
      await agentsAPI.delete(agent.id);
      setMyAgents(myAgents.filter((a) => a.id !== agent.id));
      setShowAgentMenu(null);
      logger.agent('Agent deleted successfully', { agentId: agent.id });
    } catch (error) {
      logger.agentError('Failed to delete agent', error as Error, { agentId: agent.id });
    } finally {
      setDeletingAgentId(null);
    }
  };

  return (
    <div className="flex h-screen bg-ivory overflow-hidden">
      <Sidebar
        currentPage="agent-store"
        showMobileMenu={showMobileMenu}
        onCloseMobileMenu={() => setShowMobileMenu(false)}
        onNavigate={onNavigate}
      />

      <div className="flex-1 overflow-auto">
        <MobileHeader
          title="Agent Store"
          onMenuClick={() => setShowMobileMenu(true)}
          onActionClick={
            activeAgentTab === 'my' ? () => setShowCreateAgentModal(true) : undefined
          }
        />

        <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
          <div className="mb-8 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Agent Store</h1>
            <p className="text-sm md:text-base text-gray-400">
              Discover pre-defined agents or create custom ones for your needs
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveAgentTab('predefined')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                activeAgentTab === 'predefined'
                  ? 'bg-ivory text-gray-900 shadow-sm border-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-ivory-dark'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Pre-defined agents</span>
            </button>
            <button
              onClick={() => setActiveAgentTab('my')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                activeAgentTab === 'my'
                  ? 'bg-ivory text-gray-900 shadow-sm border-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-ivory-dark'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>My agents</span>
            </button>
          </div>

          <div className="bg-ivory rounded-xl border-2 border-red-600 shadow-sm">
            <div className="p-5 md:p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-900">
                    {activeAgentTab === 'predefined' ? 'Pre-defined agents' : 'My Agents'}
                  </h2>
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                    ?
                  </div>
                </div>
                {activeAgentTab === 'my' && (
                  <button
                    onClick={() => {
                      setSelectedAgent(null);
                      setShowCreateAgentModal(true);
                    }}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create Agent
                  </button>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-400 mt-2">
                {activeAgentTab === 'predefined'
                  ? 'Ready-to-use, situation-specific, 1-click agents for common meeting tasks.'
                  : 'Create one-click, situation-specific agents for tasks you expect will come up in meetings.'}
              </p>
            </div>

            <div className="p-4 md:p-6">
              {currentAgents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="mb-2 font-medium">No custom agents yet</p>
                  <p className="text-sm mb-4">Create your first AI agent to get started.</p>
                  <button
                    onClick={() => setShowCreateAgentModal(true)}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 border-2 border-red-600"
                  >
                    Create Agent
                  </button>
                </div>
              ) : (
                currentAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50/50 rounded-lg border border-gray-100 mb-2 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setShowAgentDetailsModal(true);
                    }}
                  >
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-red-600">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 text-sm">{agent.name}</h3>
                        <p className="text-xs md:text-sm text-gray-400 truncate">
                          {agent.description}
                        </p>
                      </div>
                      <div className="hidden md:block text-sm text-gray-400">
                        {agent.tags.length > 0 ? agent.tags.join(', ') : 'No tag'}
                      </div>
                    </div>
                    {activeAgentTab === 'my' && (
                      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAgentMenu(showAgentMenu === agent.id ? null : agent.id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                        {showAgentMenu === agent.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowAgentMenu(null)}
                            />
                            <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <button
                                onClick={() => {
                                  setSelectedAgent(agent);
                                  setShowCreateAgentModal(true);
                                  setShowAgentMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAgent(agent)}
                                disabled={deletingAgentId === agent.id}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingAgentId === agent.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash className="w-4 h-4" />
                                )}
                                {deletingAgentId === agent.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreateAgentModal && (
        <CreateAgentModal
          agent={selectedAgent}
          onClose={() => {
            setShowCreateAgentModal(false);
            setSelectedAgent(null);
          }}
          onCreate={handleCreateAgent}
          onUpdate={handleEditAgent}
        />
      )}

      {showAgentDetailsModal && selectedAgent && (
        <AgentDetailsModal
          agent={selectedAgent}
          onClose={() => {
            setShowAgentDetailsModal(false);
            setSelectedAgent(null);
          }}
        />
      )}
    </div>
  );
};

export default AgentStorePage;
