import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, MessageSquare, Bot, List, Send, Loader2, Globe } from 'lucide-react';
import { Session, ChatMessage } from '@shared/types';
import { llmAPI, sessionsAPI } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
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
    if (activeTab === 'summary' && session.summary && !summary) {
      setSummary(session.summary);
      if (session.summaryData) {
        setSummaryData(session.summaryData);
      }
    }
  }, [activeTab, session.summary, session.summaryData, summary]);

  const markdownTemplate = `## Meeting Summary Report

#### Purpose
{{purpose}}

#### What Happened
{{what_happened}}

#### What Was Done
{{what_was_done}}

#### Key Questions Asked
{{what_asked}}

#### Key Takeaways
{{key_takeaways}}

#### Action Items
{{action_items}}`;

  const formatAsBullets = (text: string): string => {
    if (!text) return 'No items recorded';
    
    // If already formatted as bullets, return as is
    if (text.includes('\n-') || text.includes('\n•') || text.includes('\n*')) {
      return text;
    }
    
    // Split by common delimiters and format as bullets
    const items = text
      .split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    if (items.length === 0) return 'No items recorded';
    
    // If single item, return as is
    if (items.length === 1) return items[0];
    
    // Format as bullet list
    return items.map(item => `- ${item}`).join('\n');
  };

  const fillMarkdownTemplate = (data: SummaryData): string => {
    let markdown = markdownTemplate;
    
    // Replace variables with actual data, format lists as bullets
    markdown = markdown.replace(/\{\{purpose\}\}/g, data.purpose || 'Not specified');
    markdown = markdown.replace(/\{\{what_happened\}\}/g, data.what_happened || 'Not specified');
    markdown = markdown.replace(/\{\{what_was_done\}\}/g, data.what_was_done || 'Not specified');
    markdown = markdown.replace(/\{\{what_asked\}\}/g, formatAsBullets(data.what_asked || 'No questions recorded'));
    markdown = markdown.replace(/\{\{key_takeaways\}\}/g, formatAsBullets(data.key_takeaways || 'No takeaways recorded'));
    markdown = markdown.replace(/\{\{action_items\}\}/g, formatAsBullets(data.action_items || 'No action items'));
    
    return markdown;
  };

  const handleGenerateSummary = async () => {
    // If summary already exists, don't regenerate
    if (session.summary) {
      setSummary(session.summary);
      if (session.summaryData) {
        setSummaryData(session.summaryData);
      }
      return;
    }

    if (session.transcript.length === 0) {
      setSummary('No transcript available to generate summary.');
      return;
    }

    setIsLoadingSummary(true);
    try {
      const result = await llmAPI.generateSummary(session.id);
      
      // Parse JSON response
      try {
        const jsonData: SummaryData = JSON.parse(result.summary);
        setSummaryData(jsonData);
        
        // Fill markdown template with data
        const filledMarkdown = fillMarkdownTemplate(jsonData);
        setSummary(filledMarkdown);
        
        // Store summary and summaryData in session
        await sessionsAPI.update(session.id, { 
          summary: filledMarkdown,
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
        console.error('Failed to parse JSON summary:', parseError);
        // Fallback: use raw summary if JSON parsing fails
        setSummary(result.summary);
        await sessionsAPI.update(session.id, { summary: result.summary });
      }
      
      // Refresh sessions to get updated data
      const updatedSessions = await sessionsAPI.getAll();
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadAnswers = async () => {
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
      setAnswers('No Q&A pairs found in the session. Ask questions in the "Ask AI" tab first.');
      return;
    }

    setIsLoadingAnswers(true);
    try {
      const result = await llmAPI.generateAnswers(session.id, undefined, qaPairs);
      setAnswers(result.answers);
    } catch (error) {
      console.error('Failed to load answers:', error);
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
    setUseWebSearch(false); // Reset flag after sending
    setIsAsking(true);
    
    try {
      const result = await llmAPI.askQuestion(session.id, question, undefined, shouldUseWebSearch);
      const aiMessage: ChatMessage = {
        text: result.answer,
        isUser: false,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to ask question:', error);
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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
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
                          msg.isUser ? 'text-blue-600' : 'text-green-600'
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
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
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
                    <p className="text-sm font-medium text-gray-500 mb-1">Ask JarWiz</p>
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
                            ? 'bg-white border-l-4 border-blue-500 text-gray-900'
                            : 'bg-gray-50 border-l-4 border-green-500 text-gray-900'
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`text-xs font-medium ${
                              msg.isUser ? 'text-blue-600' : 'text-green-600'
                            }`}
                          >
                            {msg.isUser ? 'You' : 'JarWiz'}
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
                        <span className="text-xs text-gray-500">JarWiz is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Input Area at Bottom */}
              <div className="border-t border-gray-200 p-4 md:p-6 flex-shrink-0 bg-white">
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
                    placeholder="Ask JarWiz about this session..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                    disabled={isAsking}
                  />
                  <button
                    onClick={() => setUseWebSearch(!useWebSearch)}
                    disabled={isAsking}
                    className={`px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                      useWebSearch 
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
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
              ) : summary ? (
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
                    {session.summary
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
                      ) : session.summary ? (
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
