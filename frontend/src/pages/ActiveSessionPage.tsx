import React, { useState, useEffect, useRef } from 'react';
import { Video, LogOut, MessageSquare, Send, Mic, MicOff, Square, Globe, Database, Plus, ChevronDown, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ChatMessage, Session } from '@shared/types';
import { meetingService } from '../services/meetingService';
import { llmAPI, sessionsAPI } from '../services/api';
import { logger } from '../utils/logger';

interface ActiveSessionPageProps {
  onNavigate: (page: string) => void;
}

const ActiveSessionPage: React.FC<ActiveSessionPageProps> = ({ onNavigate }) => {
  const [chatInput, setChatInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useRAGSearch, setUseRAGSearch] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const { chatMessages, setChatMessages, selectedSession, user } = useAppContext();

  useEffect(() => {
    if (selectedSession) {
      logger.activeSession('Active session page loaded', { sessionId: selectedSession.id });
      meetingService.initializeBroadcastChannel(selectedSession.id);
    }

    return () => {
      logger.activeSession('Cleaning up active session');
      meetingService.cleanup();
    };
  }, [selectedSession]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleConnectMeeting = async () => {
    try {
      const meetingStream = await meetingService.requestScreenShare();
      setStream(meetingStream.stream);
      setIsConnected(true);

      // Initialize speech recognition
      meetingService.initializeSpeechRecognition(
        (text, isFinal) => {
          setCurrentTranscript(text);
          if (isFinal && text.trim() && selectedSession) {
            // Add final transcript to history
            setTranscriptHistory((prev) => [...prev, text.trim()]);
            setCurrentTranscript('');
            
            // Scroll transcript to bottom
            setTimeout(() => {
              if (transcriptRef.current) {
                transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
              }
            }, 100);
          }
        },
        (error) => {
          console.error('Speech recognition error:', error);
        }
      );

      // Start speech recognition
      meetingService.startSpeechRecognition();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Failed to connect to meeting:', error);
      alert(error.message || 'Failed to connect to meeting');
    }
  };

  const handleDisconnect = async () => {
    // Save transcript history before disconnecting
    if (selectedSession && (transcriptHistory.length > 0 || currentTranscript.trim())) {
      try {
        const messages = [...transcriptHistory];
        // Add current interim transcript if exists
        if (currentTranscript.trim()) {
          messages.push(currentTranscript.trim());
        }
        
        const transcriptMessages = messages.map((text) => ({
          sender: 'Meeting Participant',
          message: text,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isUser: true,
        }));
        
        await sessionsAPI.addTranscript(selectedSession.id, transcriptMessages);
        setTranscriptHistory([]); // Clear after saving
        setCurrentTranscript(''); // Clear current transcript
      } catch (error) {
        console.error('Failed to save transcript:', error);
      }
    }

    meetingService.stopScreenShare();
    meetingService.stopSpeechRecognition();
    setStream(null);
    setIsConnected(false);
    setIsRecording(false);
    setCurrentTranscript('');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedSession) return;

    // Check if this is the first message BEFORE adding user message
    const isFirstMessage = chatMessages.length === 0;

    const userMessage: ChatMessage = {
      text: chatInput,
      isUser: true,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages([...chatMessages, userMessage]);
    const question = chatInput;
    const shouldUseWebSearch = useWebSearch;
    const shouldUseRAGSearch = useRAGSearch;
    setChatInput('');
    // Keep selection persistent - don't reset flags
    setShowSearchDropdown(false);

    logger.aiAnswer('Sending message to AI', { 
      sessionId: selectedSession.id, 
      question: question.substring(0, 100),
      useWebSearch: shouldUseWebSearch,
      useRAGSearch: shouldUseRAGSearch,
      agentId: selectedSession.agentIds?.[0],
      isFirstMessage,
    });

    try {
      // If RAG search is enabled, search IndexedDB for small files
      let indexedDBChunks: Array<{
        id: string;
        text: string;
        score?: number;
        metadata?: Record<string, any>;
      }> = [];

      if (shouldUseRAGSearch && selectedSession.documentIds && selectedSession.documentIds.length > 0) {
        try {
          const { searchChunksClient } = await import('../services/clientRAGService');
          const chunks = await searchChunksClient(
            question,
            'default-user', // TODO: Get from auth
            undefined, // Search across all documents in session
            5
          );

          indexedDBChunks = chunks.map(chunk => ({
            id: chunk.id,
            text: chunk.text,
            score: chunk.score,
            metadata: chunk.metadata,
          }));

          if (indexedDBChunks.length > 0) {
            logger.aiAnswer('Found IndexedDB chunks for RAG search', {
              sessionId: selectedSession.id,
              chunkCount: indexedDBChunks.length,
            });
          }
        } catch (error) {
          logger.aiAnswerError('IndexedDB search failed', error as Error, {
            sessionId: selectedSession.id,
          });
          // Continue with backend RAG search even if IndexedDB fails
        }
      }

      // Use session context (agents, documents) for AI response
      // Pass IndexedDB chunks to backend for merging with Pinecone results
      // Only pass username for greeting on the first message
      const result = await llmAPI.askQuestion(
        selectedSession.id,
        question,
        selectedSession.agentIds?.[0], // Use first agent if available
        shouldUseWebSearch,
        shouldUseRAGSearch,
        indexedDBChunks.length > 0 ? indexedDBChunks : undefined,
        isFirstMessage ? user.name : undefined // Only pass username for first message greeting
      );

      const aiResponse: ChatMessage = {
        text: result.answer,
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
      logger.aiAnswer('AI response received', { 
        sessionId: selectedSession.id, 
        answerLength: result.answer.length 
      });
    } catch (error) {
      logger.aiAnswerError('Failed to get AI response', error as Error, { sessionId: selectedSession.id });
      const errorResponse: ChatMessage = {
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorResponse]);
    }
  };

  const handleExitSession = async () => {
    if (isExiting) return; // Prevent double-click
    
    setIsExiting(true);
    
    try {
      // Save transcript history to session before exiting
      let sessionToSummarize: Session | null = null;
      if (selectedSession && (transcriptHistory.length > 0 || currentTranscript.trim())) {
        try {
          const messages = [...transcriptHistory];
          // Add current interim transcript if exists
          if (currentTranscript.trim()) {
            messages.push(currentTranscript.trim());
          }
          
          const transcriptMessages = messages.map((text) => ({
            sender: 'Meeting Participant',
            message: text,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            isUser: true,
          }));
          
          await sessionsAPI.addTranscript(selectedSession.id, transcriptMessages);
          sessionToSummarize = selectedSession;
        } catch (error) {
          console.error('Failed to save transcript:', error);
        }
      }

      meetingService.cleanup();
      
      // Generate summary in the background (don't wait for it)
      if (sessionToSummarize) {
        // Small delay to ensure transcript is saved, then fetch updated session
        setTimeout(() => {
          sessionsAPI.getById(sessionToSummarize.id)
            .then((updatedSession) => {
              if (updatedSession.transcript && updatedSession.transcript.length > 0 && !updatedSession.summaryData) {
                // Generate summary asynchronously in the background
                llmAPI.generateSummary(updatedSession.id)
                  .then((result) => {
                    try {
                      const jsonData = JSON.parse(result.summary);
                      // Store summaryData in session
                      sessionsAPI.update(updatedSession.id, {
                        summary: '',
                        summaryData: jsonData
                      }).catch((error) => {
                        logger.aiAnswerError('Failed to save background summary', error as Error, { sessionId: updatedSession.id });
                      });
                      
                      // Extract first chunk for session description
                      const descriptionChunk = jsonData.purpose || jsonData.what_happened || '';
                      if (descriptionChunk) {
                        const shortDescription = descriptionChunk.substring(0, 200).trim();
                        const lastPeriod = shortDescription.lastIndexOf('.');
                        const finalDescription = lastPeriod > 50 
                          ? shortDescription.substring(0, lastPeriod + 1) 
                          : shortDescription;
                        
                        sessionsAPI.update(updatedSession.id, { description: finalDescription })
                          .catch((error) => {
                            logger.aiAnswerError('Failed to update session description', error as Error, { sessionId: updatedSession.id });
                          });
                      }
                    } catch (parseError) {
                      logger.aiAnswerError('Failed to parse background summary JSON', parseError as Error, { sessionId: updatedSession.id });
                    }
                  })
                  .catch((error) => {
                    logger.aiAnswerError('Failed to generate background summary', error as Error, { sessionId: updatedSession.id });
                  });
              }
            })
            .catch((error) => {
              logger.aiAnswerError('Failed to fetch session for summary generation', error as Error, { sessionId: sessionToSummarize.id });
            });
        }, 500); // Small delay to ensure transcript is saved
      }
      
      // Smooth transition to sessions page
      setTimeout(() => {
        onNavigate('sessions');
        setChatMessages([]);
        setChatInput('');
        setIsConnected(false);
        setIsRecording(false);
        setStream(null);
        setCurrentTranscript('');
        setTranscriptHistory([]);
        setIsExiting(false);
      }, 300);
    } catch (error) {
      console.error('Failed to exit session:', error);
      setIsExiting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-900">
      {/* Left Column - Video Integration */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-3 md:p-4 flex items-center justify-between bg-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Video className="w-4 md:w-5 h-4 md:h-5 text-white flex-shrink-0" />
            <h2 className="text-white font-semibold text-sm md:text-base truncate">
              Meeting Session
            </h2>
          </div>
          <button
            onClick={handleExitSession}
            disabled={isExiting}
            className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
              isExiting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isExiting ? (
              <Loader2 className="w-3 md:w-4 h-3 md:h-4 animate-spin" />
            ) : (
              <LogOut className="w-3 md:w-4 h-3 md:h-4" />
            )}
            <span className="hidden sm:inline">{isExiting ? 'Exiting...' : 'Exit'}</span>
          </button>
        </div>

        <div className="flex-1 bg-gray-900 relative overflow-hidden">
          {isConnected && stream ? (
            <div className="w-full h-full flex flex-col">
              {/* Split View: Top Half - Screen Share */}
              <div className="h-1/2 bg-black relative flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium z-10">
                    <div className="w-2 h-2 bg-ivory rounded-full animate-pulse border border-red-600"></div>
                    Recording
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button
                    onClick={handleDisconnect}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Square className="w-4 h-4" />
                    Stop Sharing
                  </button>
                </div>
              </div>

              {/* Split View: Bottom Half - Live STT Transcript */}
              <div className="h-1/2 bg-gray-800 border-t border-gray-700 flex flex-col">
                <div className="p-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-red-500" />
                    <h3 className="text-white font-semibold text-sm">Live Transcript</h3>
                  </div>
                  {isRecording && (
                    <div className="flex items-center gap-2 text-red-500 text-xs">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>Listening...</span>
                    </div>
                  )}
                </div>
                <div
                  ref={transcriptRef}
                  className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0"
                >
                  {transcriptHistory.length === 0 && !currentTranscript ? (
                    <div className="text-center text-gray-400 mt-8">
                      <Mic className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                      <p className="text-sm">Transcript will appear here...</p>
                    </div>
                  ) : (
                    <>
                      {transcriptHistory.map((text, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-700/50 rounded-lg p-3 text-white text-sm"
                        >
                          <p>{text}</p>
                        </div>
                      ))}
                      {currentTranscript && (
                        <div className="bg-gray-700 rounded-lg p-3 text-white text-sm border-l-2 border-blue-500">
                          <p className="text-gray-300 italic">{currentTranscript}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="text-center max-w-md w-full">
                <div className="w-16 md:w-24 h-16 md:h-24 bg-gray-700 rounded-full mx-auto mb-3 md:mb-4 flex items-center justify-center">
                  <Video className="w-8 md:w-12 h-8 md:h-12 text-gray-400" />
                </div>
                <p className="text-gray-400 mb-3 md:mb-4 text-sm md:text-base">
                  No active meeting connected
                </p>
                <button
                  onClick={handleConnectMeeting}
                  className="px-4 md:px-6 py-2 md:py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 mx-auto text-sm md:text-base border-2 border-red-600"
                >
                  <Video className="w-4 md:w-5 h-4 md:h-5" />
                  Connect to Meeting
                </button>
              </div>

              {/* Connection Instructions */}
              <div className="absolute bottom-4 left-4 right-4 bg-gray-800 p-3 md:p-4 rounded-lg text-xs md:text-sm text-gray-300 max-w-2xl mx-auto">
                <h3 className="font-semibold mb-2">How to Connect:</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click on 'Connect to Meeting' button</li>
                  <li>Choose the tab showing your Google Meet, Zoom, or Teams meeting</li>
                  <li>Make sure to select the "Share tab audio" option</li>
                  <li>Click on 'Share' button</li>
                </ol>
                <p className="mt-2 text-gray-400">
                  Supported platforms: Google Meet, Microsoft Teams, Zoom
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Chat */}
      <div className="w-full lg:w-96 bg-ivory flex flex-col border-l-2 border-red-600 max-h-[50vh] lg:max-h-full">
        <div className="p-3 md:p-4 border-b-2 border-red-600 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">AI Answer</h3>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Ask Qbot for any session related query, answer, assistance...
              </p>
            </div>
            {isRecording && (
              <div className="flex items-center gap-2 text-red-600">
                <Mic className="w-4 h-4" />
                <span className="text-xs font-medium">Live</span>
              </div>
            )}
          </div>
        </div>

        <div 
          ref={chatMessagesRef}
          className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 min-h-0"
        >
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-400 mt-8 md:mt-12">
              <MessageSquare className="w-10 md:w-12 h-10 md:h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm md:text-base">AI will start to appear here...</p>
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] md:max-w-[80%] rounded-lg p-2 md:p-3 ${
                    msg.isUser ? 'bg-black text-white border-2 border-red-600' : 'bg-ivory-dark text-gray-900 border-2 border-gray-300'
                  }`}
                >
                  <div className="mb-1">
                    <p className={`text-xs font-medium ${msg.isUser ? 'text-gray-300' : 'text-gray-600'}`}>
                      {msg.isUser ? 'You' : 'Qbot'}
                    </p>
                    <p className={`text-xs ${msg.isUser ? 'text-gray-400' : 'text-gray-500'}`}>
                      {msg.time}
                    </p>
                  </div>
                  <p className="text-xs md:text-sm">{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 md:p-4 border-t-2 border-red-600 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Qbot..."
              className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
            <div className="relative flex-shrink-0" ref={searchDropdownRef}>
              <button
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                className={`px-2 md:px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                  (useWebSearch || useRAGSearch)
                    ? 'bg-black text-white hover:bg-gray-900 border-2 border-red-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-red-600'
                }`}
                title="Search options"
              >
                <Plus className="w-4 md:w-5 h-4 md:h-5" />
                <ChevronDown className="w-3 h-3" />
              </button>
              {showSearchDropdown && (
                <div className="absolute bottom-full right-0 mb-2 bg-ivory rounded-lg shadow-lg border-2 border-red-600 py-2 z-50 min-w-[160px]">
                  <button
                    onClick={() => {
                      setUseWebSearch(!useWebSearch);
                      setUseRAGSearch(false);
                      setShowSearchDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      useWebSearch
                        ? 'bg-black text-white border-2 border-red-600'
                          : 'text-gray-700 hover:bg-ivory-dark border-2 border-transparent hover:border-red-600'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Web Search</span>
                    {useWebSearch && <span className="ml-auto text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setUseRAGSearch(!useRAGSearch);
                      setUseWebSearch(false);
                      setShowSearchDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      useRAGSearch
                        ? 'bg-black text-white border-2 border-red-600'
                          : 'text-gray-700 hover:bg-ivory-dark border-2 border-transparent hover:border-red-600'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>RAG Search</span>
                    {useRAGSearch && <span className="ml-auto text-xs">✓</span>}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              className="px-3 md:px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors flex-shrink-0 border-2 border-red-600"
            >
              <Send className="w-4 md:w-5 h-4 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveSessionPage;
