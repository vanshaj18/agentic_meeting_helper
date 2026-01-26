import React, { useState, useEffect, useRef } from 'react';
import { Video, LogOut, MessageSquare, Send, Mic, MicOff, Square, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ChatMessage, Session } from '@shared/types';
import { meetingService } from '../services/meetingService';
import { llmAPI, sessionsAPI } from '../services/api';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const { chatMessages, setChatMessages, selectedSession } = useAppContext();

  useEffect(() => {
    if (selectedSession) {
      meetingService.initializeBroadcastChannel(selectedSession.id);
    }

    return () => {
      meetingService.cleanup();
    };
  }, [selectedSession]);

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

    const userMessage: ChatMessage = {
      text: chatInput,
      isUser: true,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages([...chatMessages, userMessage]);
    const question = chatInput;
    const shouldUseWebSearch = useWebSearch;
    setChatInput('');
    setUseWebSearch(false); // Reset flag after sending

    try {
      // Use session context (agents, documents) for AI response
      const result = await llmAPI.askQuestion(
        selectedSession.id,
        question,
        selectedSession.agentIds?.[0], // Use first agent if available
        shouldUseWebSearch
      );

      const aiResponse: ChatMessage = {
        text: result.answer,
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorResponse: ChatMessage = {
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorResponse]);
    }
  };

  const handleExitSession = async () => {
    // Save transcript history to session before exiting
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
      } catch (error) {
        console.error('Failed to save transcript:', error);
      }
    }

    meetingService.cleanup();
    onNavigate('sessions');
    setChatMessages([]);
    setChatInput('');
    setIsConnected(false);
    setIsRecording(false);
    setStream(null);
    setCurrentTranscript('');
    setTranscriptHistory([]);
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
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base whitespace-nowrap flex-shrink-0"
          >
            <LogOut className="w-3 md:w-4 h-3 md:h-4" />
            <span className="hidden sm:inline">Exit</span>
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
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
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
                  className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto text-sm md:text-base"
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
      <div className="w-full lg:w-96 bg-white flex flex-col border-l border-gray-200 max-h-[50vh] lg:max-h-full">
        <div className="p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">AI Answer</h3>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Ask JarWiz for any session related query, answer, assistance...
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
                    msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="mb-1">
                    <p className={`text-xs font-medium ${msg.isUser ? 'text-blue-100' : 'text-gray-600'}`}>
                      {msg.isUser ? 'You' : 'JarWiz'}
                    </p>
                    <p className={`text-xs ${msg.isUser ? 'text-blue-200' : 'text-gray-500'}`}>
                      {msg.time}
                    </p>
                  </div>
                  <p className="text-xs md:text-sm">{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 md:p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask JarWiz..."
              className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
            <button
              onClick={() => setUseWebSearch(!useWebSearch)}
              className={`px-2 md:px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${
                useWebSearch 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={useWebSearch ? "Web search enabled - click to disable" : "Enable web search"}
            >
              <Globe className="w-4 md:w-5 h-4 md:h-5" />
            </button>
            <button
              onClick={handleSendMessage}
              className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
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
