import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, MessageSquare, Bot, List, Send, Loader2, Globe } from 'lucide-react';
import { Session, ChatMessage } from '@shared/types';
import { llmAPI, sessionsAPI } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import SummaryDisplay from '../SummaryDisplay';
import { logger } from '../../utils/logger';
import ReactMarkdown from 'react-markdown';

interface SessionReviewModalProps {
  session: Session;
  onClose: () => void;
}

interface SummaryData {
  purpose?: string;
  what_happened?: string;
  what_was_done?: string;
  what_asked?: string;
  key_takeaways?: string;
  action_items?: string;
}

const SessionReviewModal: React.FC<SessionReviewModalProps> = ({ session, onClose }) => {
  const [activeTab, setActiveTab] = useState<'transcript' | 'answers' | 'ask-ai' | 'summary'>('transcript');
  const [summary, setSummary] = useState<string>(session.summary || '');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(session.summaryData || null);
  const [answers, setAnswers] = useState<string>('');
  const [askQuestion, setAskQuestion] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const { setSessions } = useAppContext();

  const tabs = [
    { id: 'transcript' as const, label: 'Transcript', icon: FileText },
    { id: 'answers' as const, label: 'Answers', icon: MessageSquare },
    { id: 'ask-ai' as const, label: 'Ask AI', icon: Bot },
    { id: 'summary' as const, label: 'Summary', icon: List },
  ];

  // Load stored summary when switching to summary tab
  useEffect(() => {
    if (activeTab === 'summary') {
      if (session.summaryData) {
        setSummaryData(session.summaryData);
      } else if (session.summary && !summaryData) {
        // Legacy support: if we have old markdown summary, try to parse it
        setSummary(session.summary);
      }
    }
  }, [activeTab, session.summary, session.summaryData]);


  const handleGenerateSummary = async () => {
    logger.aiAnswer('Generating session summary', { sessionId: session.id });
    
    // If summary already exists (generated in background), refresh and show it with a small delay
    if (session.summaryData) {
      logger.aiAnswer('Summary already exists, loading existing', { sessionId: session.id });
      setIsLoadingSummary(true);
      
      // Refresh session data to ensure we have the latest summaryData
      try {
        const updatedSession = await sessionsAPI.getById(session.id);
        if (updatedSession.summaryData) {
          // Small delay before showing the summary
          setTimeout(() => {
            setSummaryData(updatedSession.summaryData!);
            setIsLoadingSummary(false);
          }, 500);
        } else {
          setIsLoadingSummary(false);
        }
      } catch (error) {
        logger.aiAnswerError('Failed to refresh session data', error as Error, { sessionId: session.id });
        // Fallback: use existing summaryData
        setTimeout(() => {
          setSummaryData(session.summaryData!);
          setIsLoadingSummary(false);
        }, 500);
      }
      return;
    }

    if (session.transcript.length === 0) {
      logger.aiAnswer('No transcript available for summary', { sessionId: session.id });
      setSummary('No transcript available to generate summary.');
      return;
    }

    setIsLoadingSummary(true);
    try {
      const result = await llmAPI.generateSummary(session.id);
      logger.aiAnswer('Summary generated successfully', { sessionId: session.id, summaryLength: result.summary.length });
      
      // Parse JSON response
      try {
        const jsonData: SummaryData = JSON.parse(result.summary);
        
        // Small delay before showing the summary
        setTimeout(() => {
          setSummaryData(jsonData);
          setIsLoadingSummary(false);
        }, 500);
        
        // Store summaryData in session (we'll render from JSON, not markdown string)
        await sessionsAPI.update(session.id, { 
          summary: '', // Clear old markdown summary
          summaryData: jsonData
        });
        
        // Extract first chunk for session description
        const descriptionChunk = jsonData.purpose || jsonData.what_happened || '';
        if (descriptionChunk) {
          const shortDescription = descriptionChunk.substring(0, 200).trim();
          const lastPeriod = shortDescription.lastIndexOf('.');
          const finalDescription = lastPeriod > 50 
            ? shortDescription.substring(0, lastPeriod + 1) 
            : shortDescription;
          
          // Update session description via API
          await sessionsAPI.update(session.id, { description: finalDescription });
        }
      } catch (parseError) {
        logger.aiAnswerError('Failed to parse JSON summary', parseError as Error, { sessionId: session.id });
        // Fallback: try to use raw summary if JSON parsing fails
        setTimeout(() => {
          setSummary(result.summary);
          setIsLoadingSummary(false);
        }, 500);
        await sessionsAPI.update(session.id, { summary: result.summary });
      }
      
      // Refresh sessions to get updated data
      const updatedSessions = await sessionsAPI.getAll();
      setSessions(updatedSessions);
      logger.aiAnswer('Summary saved and sessions refreshed', { sessionId: session.id });
    } catch (error) {
      logger.aiAnswerError('Failed to generate summary', error as Error, { sessionId: session.id });
      setSummary('Failed to generate summary. Please try again.');
      setIsLoadingSummary(false);
    }
  };

  const loadAnswers = async () => {
    logger.aiAnswer('Loading answers and insights', { sessionId: session.id });
    // Extract Q&A pairs from chat messages (user questions and AI answers)
    const qaPairs: { question: string; answer: string }[] = [];
    for (let i = 0; i < chatMessages.length; i++) {
      if (chatMessages[i].isUser) {
        // User question
        const question = chatMessages[i].text;
        // Look for AI answer (next non-user message)
        if (i + 1 < chatMessages.length && !chatMessages[i + 1].isUser) {
          const answer = chatMessages[i + 1].text;
          qaPairs.push({ question, answer });
        }
      }
    }

    if (qaPairs.length === 0) {
      logger.aiAnswer('No Q&A pairs found', { sessionId: session.id });
      setAnswers('No Q&A pairs found in the session. Ask questions in the "Ask AI" tab first.');
      return;
    }

    logger.aiAnswer('Generating answers from Q&A pairs', { sessionId: session.id, qaPairCount: qaPairs.length });
    setIsLoadingAnswers(true);
    try {
      const result = await llmAPI.generateAnswers(session.id, undefined, qaPairs);
      setAnswers(result.answers);
      logger.aiAnswer('Answers generated successfully', { sessionId: session.id, answerLength: result.answers.length });
    } catch (error) {
      logger.aiAnswerError('Failed to generate answers', error as Error, { sessionId: session.id });
      setAnswers('Failed to generate answers. Please try again.');
    } finally {
      setIsLoadingAnswers(false);
    }
  };

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === 'ask-ai' && chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  const handleAskQuestion = async () => {
    if (!askQuestion.trim() || isAsking) return;
    
    const question = askQuestion.trim();
    const shouldUseWebSearch = useWebSearch;
    const userMessage: ChatMessage = {
      text: question,
      isUser: true,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    
    setChatMessages((prev) => [...prev, userMessage]);
    setAskQuestion('');
    // Keep selection persistent - don't reset flag
    setIsAsking(true);
    
    logger.aiAnswer('Asking question in session review', { 
      sessionId: session.id, 
      question: question.substring(0, 100),
      useWebSearch: shouldUseWebSearch
    });
    
    try {
      const result = await llmAPI.askQuestion(session.id, question, undefined, shouldUseWebSearch);
      const aiMessage: ChatMessage = {
        text: result.answer,
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
      logger.aiAnswer('Question answered in session review', { 
        sessionId: session.id, 
        answerLength: result.answer.length 
      });
    } catch (error) {
      logger.aiAnswerError('Failed to ask question in session review', error as Error, { sessionId: session.id });
      const errorMessage: ChatMessage = {
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-ivory rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-2 border-red-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">{session.name} - Review</h2>
            <p className="text-xs md:text-sm text-gray-400 mt-1">{session.date}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-50 rounded-lg flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-1 px-4 md:px-6 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'text-gray-900 border-gray-900'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 ${activeTab === 'ask-ai' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto p-5 md:p-6'}`}>
          {activeTab === 'transcript' && (
            <div className="space-y-4">
              {session.transcript.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">No transcript available</p>
                </div>
              ) : (
                session.transcript.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`border-l-4 pl-4 py-2 ${
                      msg.isUser ? 'border-blue-500' : 'border-green-500'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                      <span
                        className={`font-medium text-sm ${
                          msg.isUser ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {msg.sender}
                      </span>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'answers' && (
            <div className="space-y-4">
              {isLoadingAnswers ? (
                <div className="text-center py-12 text-gray-400">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 text-gray-300 animate-spin" />
                  <p className="text-sm">Generating answers...</p>
                </div>
              ) : answers ? (
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-red-600">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2 text-sm">AI-Generated Answers & Insights</h3>
                      <div className="prose prose-sm max-w-none">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {answers}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm mb-2 font-medium text-gray-500">AI Answers</p>
                  <p className="text-xs text-gray-400 mb-4">
                    Generate insights from Q&A pairs asked during the session
                  </p>
                  <button
                    onClick={loadAnswers}
                    disabled={isLoadingAnswers || chatMessages.length === 0}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {isLoadingAnswers ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Need Answers
                      </>
                    )}
                  </button>
                  {chatMessages.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Ask questions in "Ask AI" tab first
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ask-ai' && (
            <div className="flex flex-col h-full">
              {/* Scrollable Chat Display */}
              <div
                ref={chatMessagesRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 min-h-0"
              >
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500 mb-1">Ask Qbot</p>
                    <p className="text-xs text-gray-400">
                      Ask questions about this session and get AI-powered insights
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.isUser ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.isUser
                            ? 'bg-ivory border-l-4 border-red-600 text-gray-900'
                            : 'bg-gray-50 border-l-4 border-green-500 text-gray-900'
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`text-xs font-medium ${
                              msg.isUser ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {msg.isUser ? 'You' : 'Qbot'}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">{msg.time}</p>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isAsking && (
                  <div className="flex justify-end">
                    <div className="bg-gray-50 border-l-4 border-green-500 rounded-lg p-4 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                        <span className="text-xs text-gray-500">Qbot is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Input Area at Bottom */}
              <div className="border-t-2 border-red-600 p-4 md:p-6 flex-shrink-0 bg-ivory">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={askQuestion}
                    onChange={(e) => setAskQuestion(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAskQuestion();
                      }
                    }}
                    placeholder="Ask Qbot about this session..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                    disabled={isAsking}
                  />
                  <button
                    onClick={() => setUseWebSearch(!useWebSearch)}
                    disabled={isAsking}
                    className={`px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                      useWebSearch 
                        ? 'bg-black text-white hover:bg-gray-900 border-2 border-red-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={useWebSearch ? "Web search enabled - click to disable" : "Enable web search"}
                  >
                    <Globe className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleAskQuestion}
                    disabled={!askQuestion.trim() || isAsking}
                    className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isAsking ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-4">
              {isLoadingSummary ? (
                <div className="text-center py-12 text-gray-400">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 text-gray-300 animate-spin" />
                  <p className="text-sm">Generating summary...</p>
                </div>
              ) : summaryData ? (
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <List className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-4 text-sm">Meeting Summary</h3>
                      <SummaryDisplay summaryData={summaryData} />
                    </div>
                  </div>
                </div>
              ) : summary ? (
                // Legacy support: if we have old markdown summary, render it
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <List className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2 text-sm">Meeting Summary</h3>
                      <div className="prose prose-sm max-w-none 
                        prose-h2:text-xl prose-h2:font-semibold prose-h2:text-black prose-h2:mt-6 prose-h2:mb-4
                        prose-h4:text-base prose-h4:font-bold prose-h4:text-black prose-h4:mt-4 prose-h4:mb-2
                        prose-p:text-gray-700 prose-p:leading-relaxed 
                        prose-ul:list-disc prose-ul:ml-6 prose-ul:mt-2 prose-ul:mb-2
                        prose-li:text-gray-700 prose-li:leading-relaxed">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <List className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm mb-2 font-medium text-gray-500">Meeting Summary</p>
                  <p className="text-xs text-gray-400 mb-4">
                    {session.summaryData || session.summary
                      ? 'Summary has been generated. Click below to view it.'
                      : session.transcript.length === 0
                      ? 'No transcript available to generate summary'
                      : 'Click the button below to generate a summary from the transcript'}
                  </p>
                  {session.transcript.length > 0 && (
                    <button
                      onClick={handleGenerateSummary}
                      disabled={isLoadingSummary}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                      {isLoadingSummary ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : session.summaryData || session.summary ? (
                        <>
                          <List className="w-4 h-4" />
                          View Summary
                        </>
                      ) : (
                        <>
                          <List className="w-4 h-4" />
                          Create Summary
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionReviewModal;
