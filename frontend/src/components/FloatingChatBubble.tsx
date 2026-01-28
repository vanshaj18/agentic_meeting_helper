import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Globe, Database, Plus, ChevronDown, X, MessageSquare } from 'lucide-react';
import { llmAPI } from '../services/api';
import { logger } from '../utils/logger';
import { searchChunksClient } from '../services/clientRAGService';
import { useAppContext } from '../context/AppContext';

interface ChatMessage {
  text: string;
  isUser: boolean;
  time: string;
}

const FloatingChatBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useRAGSearch, setUseRAGSearch] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAppContext();
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    // Check if this is the first message BEFORE adding user message
    const isFirstMessage = chatMessages.length === 0;

    const userMessage: ChatMessage = {
      text: chatInput,
      isUser: true,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    const question = chatInput;
    const shouldUseWebSearch = useWebSearch;
    const shouldUseRAGSearch = useRAGSearch;
    setChatInput('');
    // Keep selection persistent - don't reset flags
    setShowSearchDropdown(false);
    setIsLoading(true);

    logger.aiAnswer('Sending message to AI (floating chat)', {
      question: question.substring(0, 100),
      useWebSearch: shouldUseWebSearch,
      useRAGSearch: shouldUseRAGSearch,
      isFirstMessage,
    });

    try {
      // If RAG search is enabled, search ALL documents in IndexedDB
      let indexedDBChunks: Array<{
        id: string;
        text: string;
        score?: number;
        metadata?: Record<string, any>;
      }> = [];

      if (shouldUseRAGSearch) {
        try {
          const chunks = await searchChunksClient(
            question,
            'default-user', // TODO: Get from auth
            undefined, // Search across ALL documents (not limited to a session)
            10 // Get more chunks for global search
          );

          indexedDBChunks = chunks.map((chunk) => ({
            id: chunk.id,
            text: chunk.text,
            score: chunk.score,
            metadata: chunk.metadata,
          }));

          if (indexedDBChunks.length > 0) {
            logger.aiAnswer('Found IndexedDB chunks for RAG search', {
              chunkCount: indexedDBChunks.length,
            });
          }
        } catch (error) {
          logger.aiAnswerError('IndexedDB search failed', error as Error);
          // Continue even if IndexedDB search fails
        }
      }

      // Call global chat endpoint (no session required)
      // Only pass username for greeting on the first message
      const result = await llmAPI.globalChat(
        question,
        undefined, // No agent
        shouldUseWebSearch,
        shouldUseRAGSearch,
        indexedDBChunks.length > 0 ? indexedDBChunks : undefined,
        isFirstMessage ? user.name : undefined, // Only pass username for first message greeting
        isFirstMessage // Pass isFirstMessage flag
      );

      // Add a small delay to show loading dots before displaying response
      await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
      
      const aiResponse: ChatMessage = {
        text: result.answer,
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
      logger.aiAnswer('AI response received (floating chat)');
    } catch (error: any) {
      logger.aiAnswerError('Failed to get AI response', error);
      const errorMessage: ChatMessage = {
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-lg hover:bg-gray-900 transition-all duration-200 flex items-center justify-center z-50 hover:scale-110 border-2 border-red-600"
          aria-label="Open AI chat"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-ivory rounded-2xl shadow-2xl border-2 border-red-600 z-50 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-red-600 bg-black rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
                <p className="text-white/80 text-xs">Ask questions about your documents</p>
              </div>
            </div>
            <button
              onClick={() => {
                // If there are messages, show confirmation dialog
                if (chatMessages.length > 0) {
                  setShowCloseConfirm(true);
                } else {
                  // No messages, just close
                  setIsOpen(false);
                }
              }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={chatMessagesRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-ivory-dark"
          >
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Start a conversation with AI</p>
                <p className="text-xs mt-1">Use the + button to enable web or RAG search</p>
              </div>
            )}
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.isUser
                      ? 'bg-black text-white border-2 border-red-600'
                      : 'bg-ivory text-gray-900 border-2 border-gray-300'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isUser ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-ivory border-2 border-gray-300 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t-2 border-red-600 bg-ivory rounded-b-2xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Ask AI..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="relative flex-shrink-0" ref={searchDropdownRef}>
                <button
                  onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                  disabled={isLoading}
                  className={`px-2 py-2 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    useWebSearch || useRAGSearch
                      ? 'bg-black text-white hover:bg-gray-900 border-2 border-red-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-red-600'
                  }`}
                  title="Search options"
                >
                  <Plus className="w-4 h-4" />
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
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors border-2 ${
                        useWebSearch
                          ? 'bg-black text-white border-red-600'
                          : 'text-gray-700 hover:bg-ivory-dark border-transparent hover:border-red-600'
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
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors border-2 ${
                        useRAGSearch
                          ? 'bg-black text-white border-red-600'
                          : 'text-gray-700 hover:bg-ivory-dark border-transparent hover:border-red-600'
                      }`}
                    >
                      <Database className="w-4 h-4" />
                      <span>RAG/IndexedDB</span>
                      {useRAGSearch && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !chatInput.trim()}
                className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-600"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Dialog */}
      {showCloseConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setShowCloseConfirm(false)}
          />
          <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-ivory rounded-2xl shadow-2xl border-2 border-red-600 z-[70] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keep Chat?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Do you want to keep this conversation? If you choose "No", the conversation will be cleared and you'll start fresh next time.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCloseConfirm(false);
                  setIsOpen(false);
                  // Keep messages - don't clear them
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Yes, Keep
              </button>
              <button
                onClick={() => {
                  setShowCloseConfirm(false);
                  setChatMessages([]); // Clear conversation
                  setIsOpen(false);
                }}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium border-2 border-red-600"
              >
                No, Delete
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FloatingChatBubble;
