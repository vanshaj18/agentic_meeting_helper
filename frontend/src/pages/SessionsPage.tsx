import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import CreateSessionModal from '../components/modals/CreateSessionModal';
import SessionReviewModal from '../components/modals/SessionReviewModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import { Calendar, MessageSquare, Plus, Trash, MoreVertical } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { sessionsAPI } from '../services/api';
import { CreateSessionData, Session } from '@shared/types';

interface SessionsPageProps {
  onNavigate: (page: string, options?: any) => void;
  initialOptions?: {
    openModal?: 'createSession';
  };
}

const SessionsPage: React.FC<SessionsPageProps> = ({ onNavigate, initialOptions }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [localSelectedSession, setLocalSelectedSession] = useState<Session | null>(null);
  const [showSessionMenu, setShowSessionMenu] = useState<number | null>(null);
  const { sessions, setSessions, setSelectedSession } = useAppContext();

  useEffect(() => {
    if (initialOptions?.openModal === 'createSession') {
      setShowCreateModal(true);
    }
  }, [initialOptions]);

  useEffect(() => {
    sessionsAPI.getAll().then(setSessions).catch(console.error);
  }, [setSessions]);

  const handleCreateSession = async (sessionData: CreateSessionData) => {
    try {
      const newSession = await sessionsAPI.create(sessionData);
      setSessions([...sessions, newSession]);
      setSelectedSession(newSession);
      setShowCreateModal(false);
      onNavigate('active-session');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleReviewSession = (session: Session) => {
    setLocalSelectedSession(session);
    setShowReviewModal(true);
    setShowSessionMenu(null);
  };

  const handleDeleteSession = async () => {
    if (!localSelectedSession) return;
    try {
      await sessionsAPI.delete(localSelectedSession.id);
      setSessions(sessions.filter((s) => s.id !== localSelectedSession.id));
      setShowDeleteModal(false);
      setLocalSelectedSession(null);
      setShowSessionMenu(null);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleDeleteClick = (session: Session) => {
    setLocalSelectedSession(session);
    setShowDeleteModal(true);
    setShowSessionMenu(null);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentPage="sessions"
        showMobileMenu={showMobileMenu}
        onCloseMobileMenu={() => setShowMobileMenu(false)}
        onNavigate={onNavigate}
      />

      <div className="flex-1 overflow-auto">
        <MobileHeader
          title="Sessions"
          onMenuClick={() => setShowMobileMenu(true)}
          onActionClick={() => setShowCreateModal(true)}
        />

        <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
          <div className="mb-8 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Your Sessions</h1>
            <p className="text-sm md:text-base text-gray-400">Review, resume, or start fresh</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-5 md:p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-900">Sessions Library</h2>
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                    ?
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Start Session
                </button>
              </div>
              <p className="text-xs md:text-sm text-gray-400 mt-2">
                Click Review to access the full transcript, AI replies, and a detailed meeting summary.
              </p>
            </div>

            <div className="p-4 md:p-5">
              {sessions.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                  <p className="mb-2 font-medium text-gray-500">No sessions yet</p>
                  <p className="text-sm mb-5 text-gray-400">Create your first session to get started.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    Create Session
                  </button>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 hover:bg-gray-50/50 rounded-lg border border-gray-100 mb-2 gap-4 transition-colors"
                  >
                    <div className="flex items-start lg:items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-50/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 text-sm">{session.name}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <div className="text-xs md:text-sm text-gray-400">
                            {session.description}
                          </div>
                          <div className="text-xs md:text-sm text-gray-400 whitespace-nowrap">
                            {session.date}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end lg:self-auto">
                      <button
                        onClick={() => handleReviewSession(session)}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 whitespace-nowrap transition-colors text-gray-600"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Review</span>
                      </button>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowSessionMenu(showSessionMenu === session.id ? null : session.id)
                          }
                          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {showSessionMenu === session.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowSessionMenu(null)}
                            />
                            <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <button
                                onClick={() => handleDeleteClick(session)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSession}
        />
      )}

      {showReviewModal && localSelectedSession && (
        <SessionReviewModal
          session={localSelectedSession}
          onClose={() => {
            setShowReviewModal(false);
            setLocalSelectedSession(null);
          }}
        />
      )}

      {showDeleteModal && localSelectedSession && (
        <DeleteConfirmModal
          title="Delete Session"
          message={`Are you sure you want to delete "${localSelectedSession.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteSession}
          onCancel={() => {
            setShowDeleteModal(false);
            setLocalSelectedSession(null);
          }}
        />
      )}
    </div>
  );
};

export default SessionsPage;
