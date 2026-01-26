// import React, { useState } from 'react';
// import { X, Calendar, MessageSquare, Video, Send, Plus, Home, BookOpen, Store, FileText, Settings, LogOut, User, ChevronDown, Menu, MoreVertical, Edit, Trash, Upload, FileIcon, GraduationCap, Bot, Shield } from 'lucide-react';

// const SessionManagementApp = () => {
//   const [currentPage, setCurrentPage] = useState('home');
//   const [showReviewModal, setShowReviewModal] = useState(false);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
//   const [showAgentDetailsModal, setShowAgentDetailsModal] = useState(false);
//   const [showMobileMenu, setShowMobileMenu] = useState(false);
//   const [activeKBTab, setActiveKBTab] = useState('documents');
//   const [activeAgentTab, setActiveAgentTab] = useState('predefined');
//   const [selectedDocument, setSelectedDocument] = useState(null);
//   const [selectedAgent, setSelectedAgent] = useState(null);
//   const [showDocMenu, setShowDocMenu] = useState(null);
//   const [showAgentMenu, setShowAgentMenu] = useState(null);
//   const [documents, setDocuments] = useState([
//     { id: 1, title: 'CV', description: 'No description', type: 'document' }
//   ]);
//   const [cueCards, setCueCards] = useState([]);
//   const [predefinedAgents, setPredefinedAgents] = useState([
//     {
//       id: 1,
//       name: 'Competitor Analysis Agent',
//       description: 'Competitor Analysis Agent',
//       tags: ['Business', 'Pitching'],
//       prompt: 'You are a competitive analysis expert. Analyze competitor information and provide strategic insights.',
//       guardrails: 'Focus on publicly available information. Provide objective analysis.'
//     },
//     {
//       id: 2,
//       name: 'What to say next?',
//       description: 'What to say next?',
//       tags: [],
//       prompt: 'You are an AI meeting guidance agent with deep expertise in corporate, project, and stakeholder meetings, capable of understanding context, objectives, participant roles, and conversation dynamics to offer the optimal next comment or question.\n\nYou must adopt a professional, concise, supportive, and action-oriented tone; provide all outputs in markdown format as exactly two lines—first line being the suggested user statement or question, second line being the brief rationale; ask clarifying questions only when essential; never reveal internal reasoning or off-topic commentary; avoid personal data collection; and always focus on driving the meeting toward its stated goals (for example, if the discussion stalls on resource allocation, you might suggest "Could we prioritize tasks based on impact and resource availability?" followed by "This helps align budget and effort with our key objectives.").',
//       guardrails: 'Never reveal internal reasoning. Focus on meeting goals. Avoid personal data collection.'
//     },
//     {
//       id: 3,
//       name: 'GTM Advisor',
//       description: 'Go to Market advisor',
//       tags: [],
//       prompt: 'You are a Go-to-Market strategy expert. Provide actionable advice on market entry, positioning, and growth strategies.',
//       guardrails: 'Base recommendations on industry best practices. Consider market dynamics and competitive landscape.'
//     },
//     {
//       id: 4,
//       name: 'Counterpoint agent',
//       description: 'Critique the point raised and generate a counter point t...',
//       tags: [],
//       prompt: 'You are a critical thinking agent. Analyze arguments and provide thoughtful counterpoints to strengthen discussions.',
//       guardrails: 'Maintain constructive tone. Focus on logical reasoning and evidence-based critiques.'
//     },
//     {
//       id: 5,
//       name: 'Summarize till now',
//       description: 'Summarize the meeting till now',
//       tags: [],
//       prompt: 'You are a meeting summarization agent. Provide concise, accurate summaries of meeting discussions and decisions.',
//       guardrails: 'Include key points, decisions, and action items. Maintain neutrality and accuracy.'
//     },
//     {
//       id: 6,
//       name: 'Cue Card Agent',
//       description: 'A specialized agent designed to help users prepare for ...',
//       tags: [],
//       prompt: 'You are a presentation preparation expert. Help users create and refine cue cards for effective presentations.',
//       guardrails: 'Focus on clarity and conciseness. Provide actionable talking points.'
//     },
//     {
//       id: 7,
//       name: 'AI Answer',
//       description: 'An intelligent Q&A assistant that provides accurate, real...',
//       tags: [],
//       prompt: 'You are an intelligent Q&A assistant. Provide accurate, real-time answers to questions during meetings.',
//       guardrails: 'Ensure factual accuracy. Cite sources when possible. Acknowledge uncertainty when appropriate.'
//     }
//   ]);
//   const [myAgents, setMyAgents] = useState([]);
//   const [sessions, setSessions] = useState([
//     {
//       id: 1,
//       name: 'test',
//       description: 'No description',
//       date: '24/01/26 16:45',
//       transcript: [
//         { sender: 'vanshaj kerni', message: 'hi', time: '11:15 AM', isUser: true },
//         { sender: 'JarWiz', message: 'The phrase "vanshaj kerni" is in Hindi, where "vanshaj" means "descendant" or "offspring," and "kerni" translates to "to do" or "to perform." Together, it can be interpreted as "to perform or carry out the lineage" or "to continue the family line."', time: '11:15 AM', isUser: false },
//         { sender: 'vanshaj kerni', message: 'What specific topics or issues would you like to discuss in this meeting?', time: '11:15 AM', isUser: true },
//         { sender: 'JarWiz', message: 'In this meeting, it would be beneficial to discuss a range of key topics that can drive our objectives forward. Here are some suggestions:\n\nProject Updates: Share progress on ongoing projects and any challenges faced.', time: '11:15 AM', isUser: false }
//       ]
//     }
//   ]);
//   const [selectedSession, setSelectedSession] = useState(null);
//   const [chatMessages, setChatMessages] = useState([]);
//   const [chatInput, setChatInput] = useState('');
//   const [activeTab, setActiveTab] = useState('answers');
//   const [isTransitioning, setIsTransitioning] = useState(false);

//   const navigateToPage = (page, options = {}) => {
//     setIsTransitioning(true);
    
//     setTimeout(() => {
//       if (options.knowledgeBaseTab) {
//         setActiveKBTab(options.knowledgeBaseTab);
//       }
//       if (options.agentTab) {
//         setActiveAgentTab(options.agentTab);
//       }
//       setCurrentPage(page);
//       setShowMobileMenu(false);
      
//       if (options.openModal) {
//         setTimeout(() => {
//           if (options.openModal === 'createSession') {
//             setShowCreateModal(true);
//           } else if (options.openModal === 'uploadDocument') {
//             setShowUploadModal(true);
//           }
//         }, 150);
//       }
      
//       setTimeout(() => {
//         setIsTransitioning(false);
//       }, 100);
//     }, 200);
//   };

//   const handleReviewClick = (session) => {
//     setSelectedSession(session);
//     setShowReviewModal(true);
//   };

//   const handleCreateSession = (sessionData) => {
//     const newSession = {
//       id: sessions.length + 1,
//       name: sessionData.name,
//       description: sessionData.description || 'No description',
//       date: new Date().toLocaleString('en-GB', { 
//         day: '2-digit', 
//         month: '2-digit', 
//         year: '2-digit',
//         hour: '2-digit',
//         minute: '2-digit'
//       }).replace(',', ''),
//       transcript: []
//     };
//     setSessions([...sessions, newSession]);
//     setShowCreateModal(false);
//     setCurrentPage('active-session');
//     setSelectedSession(newSession);
//   };

//   const handleExitSession = () => {
//     setCurrentPage('sessions');
//     setChatMessages([]);
//     setChatInput('');
//   };

//   const handleUploadDocument = (docData) => {
//     const newDoc = {
//       id: documents.length + cueCards.length + 1,
//       title: docData.title,
//       description: docData.description,
//       type: activeKBTab === 'documents' ? 'document' : 'cuecard'
//     };
//     if (activeKBTab === 'documents') {
//       setDocuments([...documents, newDoc]);
//     } else {
//       setCueCards([...cueCards, newDoc]);
//     }
//     setShowUploadModal(false);
//   };

//   const handleEditDocument = (docData) => {
//     if (selectedDocument.type === 'document') {
//       setDocuments(documents.map(doc => 
//         doc.id === selectedDocument.id 
//           ? { ...doc, title: docData.title, description: docData.description }
//           : doc
//       ));
//     } else {
//       setCueCards(cueCards.map(card => 
//         card.id === selectedDocument.id 
//           ? { ...card, title: docData.title, description: docData.description }
//           : card
//       ));
//     }
//     setShowEditModal(false);
//     setSelectedDocument(null);
//   };

//   const handleDeleteDocument = (doc) => {
//     if (doc.type === 'document') {
//       setDocuments(documents.filter(d => d.id !== doc.id));
//     } else {
//       setCueCards(cueCards.filter(c => c.id !== doc.id));
//     }
//     setShowDocMenu(null);
//   };

//   const handleCreateAgent = (agentData) => {
//     const newAgent = {
//       id: myAgents.length + predefinedAgents.length + 1,
//       name: agentData.name,
//       description: agentData.description,
//       tags: agentData.tags ? agentData.tags.split(',').map(t => t.trim()) : [],
//       prompt: agentData.prompt,
//       guardrails: agentData.guardrails
//     };
//     setMyAgents([...myAgents, newAgent]);
//     setShowCreateAgentModal(false);
//   };

//   const handleEditAgent = (agentData) => {
//     setMyAgents(myAgents.map(agent => 
//       agent.id === selectedAgent.id 
//         ? { 
//             ...agent, 
//             name: agentData.name,
//             description: agentData.description,
//             tags: agentData.tags ? agentData.tags.split(',').map(t => t.trim()) : [],
//             prompt: agentData.prompt,
//             guardrails: agentData.guardrails
//           }
//         : agent
//     ));
//     setShowCreateAgentModal(false);
//     setSelectedAgent(null);
//   };

//   const handleDeleteAgent = (agent) => {
//     setMyAgents(myAgents.filter(a => a.id !== agent.id));
//     setShowAgentMenu(null);
//   };

//   // Home Page
//   if (currentPage === 'home') {
//     return (
//       <div className="flex h-screen bg-gray-50 overflow-hidden">
//         {/* Mobile Menu Overlay */}
//         {showMobileMenu && (
//           <div 
//             className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//             onClick={() => setShowMobileMenu(false)}
//           />
//         )}

//         {/* Left Sidebar */}
//         <div className={`
//           fixed lg:static inset-y-0 left-0 z-50
//           w-64 lg:w-56 bg-white border-r border-gray-200 flex flex-col
//           transform transition-transform duration-300 ease-in-out
//           ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//         `}>
//           <div className="p-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3 flex-1 min-w-0">
//                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
//                   <User className="w-5 h-5 text-blue-600" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="text-sm font-semibold text-gray-900 truncate">vanshaj kerni</div>
//                   <div className="text-xs text-gray-500 truncate">masamuno18@gmail.com</div>
//                 </div>
//               </div>
//               <button 
//                 onClick={() => setShowMobileMenu(false)}
//                 className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           <nav className="flex-1 p-3 overflow-y-auto">
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg mb-1">
//               <Home className="w-4 h-4 flex-shrink-0" />
//               <span>Home</span>
//             </button>
//             <button 
//               onClick={() => navigateToPage('sessions')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1"
//             >
//               <Calendar className="w-4 h-4 flex-shrink-0" />
//               <span>Sessions</span>
//             </button>
//             <button 
//               onClick={() => navigateToPage('knowledge-base')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1"
//             >
//               <BookOpen className="w-4 h-4 flex-shrink-0" />
//               <span>Knowledge Base</span>
//             </button>
//             <button 
//               onClick={() => navigateToPage('agent-store')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1"
//             >
//               <Store className="w-4 h-4 flex-shrink-0" />
//               <span>Agent Store</span>
//             </button>
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
//               <FileText className="w-4 h-4 flex-shrink-0" />
//               <span>Templates</span>
//             </button>
//           </nav>

//           <div className="p-3 border-t border-gray-200">
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1">
//               <Settings className="w-4 h-4 flex-shrink-0" />
//               <span>Settings</span>
//             </button>
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
//               <LogOut className="w-4 h-4 flex-shrink-0" />
//               <span>Sign Out</span>
//             </button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 overflow-auto">
//           {/* Mobile Header */}
//           <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
//             <div className="flex items-center justify-between">
//               <button 
//                 onClick={() => setShowMobileMenu(true)}
//                 className="p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <Menu className="w-6 h-6" />
//               </button>
//               <h1 className="text-lg font-bold text-gray-900">Home</h1>
//               <div className="w-10"></div>
//             </div>
//           </div>

//           <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
//             {/* Welcome Section */}
//             <div className="mb-8 md:mb-12">
//               <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">Welcome, vanshaj kerni!</h1>
//               <p className="text-base md:text-lg text-gray-600 mb-2">Ready to ace your next meeting?</p>
//               <p className="text-sm md:text-base text-gray-600">
//                 Get real-time answers, surface the right documents, recall pre-set responses, and background agent support, all in just 1- click.
//               </p>
//             </div>

//             {/* Action Cards */}
//             <div className="mb-6 md:mb-8">
//               <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Get ready for your meeting</h2>
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
//                 {/* Upload Files Card */}
//                 <button
//                   onClick={() => navigateToPage('knowledge-base', { 
//                     knowledgeBaseTab: 'documents',
//                     openModal: 'uploadDocument'
//                   })}
//                   className="group bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
//                 >
//                   <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
//                     <FileText className="w-6 h-6 text-green-600" />
//                   </div>
//                   <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
//                     Upload Files
//                     <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </h3>
//                   <p className="text-sm text-gray-600">For in-meeting assistance and citations</p>
//                 </button>

//                 {/* Create Cue Cards Card */}
//                 <button
//                   onClick={() => navigateToPage('knowledge-base', { 
//                     knowledgeBaseTab: 'cuecards',
//                     openModal: 'uploadDocument'
//                   })}
//                   className="group bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
//                 >
//                   <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
//                     <GraduationCap className="w-6 h-6 text-purple-600" />
//                   </div>
//                   <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
//                     Create Cue Cards
//                     <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </h3>
//                   <p className="text-sm text-gray-600">For exact, pre-prepared answer recall in meeting</p>
//                 </button>

//                 {/* Setup Agent Card */}
//                 <button
//                   onClick={() => navigateToPage('agent-store', { agentTab: 'predefined' })}
//                   className="group bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
//                 >
//                   <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
//                     <Bot className="w-6 h-6 text-orange-600" />
//                   </div>
//                   <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
//                     Setup Agent
//                     <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </h3>
//                   <p className="text-sm text-gray-600">To run pre-set actions, instantly, with 1-click.</p>
//                 </button>

//                 {/* Start New Session Card */}
//                 <button
//                   onClick={() => navigateToPage('sessions', { openModal: 'createSession' })}
//                   className="group bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
//                 >
//                   <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
//                     <Plus className="w-6 h-6 text-blue-600" />
//                   </div>
//                   <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
//                     Start New Session
//                     <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </h3>
//                   <p className="text-sm text-gray-600">Join meeting fully prepared and confident</p>
//                 </button>

//                 {/* Review Meeting Card */}
//                 <button
//                   onClick={() => navigateToPage('sessions')}
//                   className="group bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
//                 >
//                   <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
//                     <Calendar className="w-6 h-6 text-indigo-600" />
//                   </div>
//                   <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
//                     Review Meeting
//                     <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </h3>
//                   <p className="text-sm text-gray-600">Recap notes, summaries and insights with Jarwiz</p>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const handleSendMessage = () => {
//     if (chatInput.trim()) {
//       setChatMessages([...chatMessages, { text: chatInput, isUser: true, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]);
//       setChatInput('');
      
//       setTimeout(() => {
//         setChatMessages(prev => [...prev, { 
//           text: 'This is an AI response to help you during your session.', 
//           isUser: false, 
//           time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
//         }]);
//       }, 1000);
//     }
//   };

//   // Sessions Page
//   if (currentPage === 'sessions') {
//     return (
//       <div className="flex h-screen bg-gray-50 overflow-hidden">
//         {/* Mobile Menu Overlay */}
//         {showMobileMenu && (
//           <div 
//             className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//             onClick={() => setShowMobileMenu(false)}
//           />
//         )}

//         {/* Left Sidebar */}
//         <div className={`
//           fixed lg:static inset-y-0 left-0 z-50
//           w-64 lg:w-56 bg-white border-r border-gray-200 flex flex-col
//           transform transition-transform duration-300 ease-in-out
//           ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//         `}>
//           <div className="p-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3 flex-1 min-w-0">
//                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
//                   <User className="w-5 h-5 text-blue-600" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="text-sm font-semibold text-gray-900 truncate">vanshaj kerni</div>
//                   <div className="text-xs text-gray-500 truncate">masamuno18@gmail.com</div>
//                 </div>
//               </div>
//               <button 
//                 onClick={() => setShowMobileMenu(false)}
//                 className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           <nav className="flex-1 p-3 overflow-y-auto">
//             <button 
//               onClick={() => setCurrentPage('sessions')}
//               className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg mb-1 ${currentPage === 'sessions' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
//             >
//               <Calendar className="w-4 h-4 flex-shrink-0" />
//               <span>Sessions</span>
//             </button>
//             <button 
//               onClick={() => setCurrentPage('knowledge-base')}
//               className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg mb-1 ${currentPage === 'knowledge-base' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
//             >
//               <BookOpen className="w-4 h-4 flex-shrink-0" />
//               <span>Knowledge Base</span>
//             </button>
//             <button 
//               onClick={() => setCurrentPage('agent-store')}
//               className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg mb-1 ${currentPage === 'agent-store' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
//             >
//               <Store className="w-4 h-4 flex-shrink-0" />
//               <span>Agent Store</span>
//             </button>
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
//               <FileText className="w-4 h-4 flex-shrink-0" />
//               <span>Templates</span>
//             </button>
//           </nav>

//           <div className="p-3 border-t border-gray-200">
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1">
//               <Settings className="w-4 h-4 flex-shrink-0" />
//               <span>Settings</span>
//             </button>
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
//               <LogOut className="w-4 h-4 flex-shrink-0" />
//               <span>Sign Out</span>
//             </button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 overflow-auto">
//           {/* Mobile Header */}
//           <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
//             <div className="flex items-center justify-between">
//               <button 
//                 onClick={() => setShowMobileMenu(true)}
//                 className="p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <Menu className="w-6 h-6" />
//               </button>
//               <h1 className="text-lg font-bold text-gray-900">Sessions</h1>
//               <button 
//                 onClick={() => setShowCreateModal(true)}
//                 className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 <Plus className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
//             <div className="mb-6 md:mb-8">
//               <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Your Sessions</h1>
//               <p className="text-sm md:text-base text-gray-600">Review, resume, or start fresh</p>
//             </div>

//             <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//               <div className="p-4 md:p-6 border-b border-gray-200">
//                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                   <div className="flex items-center gap-2">
//                     <h2 className="text-lg font-semibold text-gray-900">Sessions Library</h2>
//                     <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 flex-shrink-0">?</div>
//                   </div>
//                   <button 
//                     onClick={() => setShowCreateModal(true)}
//                     className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
//                   >
//                     <Plus className="w-4 h-4" />
//                     Start Session
//                   </button>
//                 </div>
//                 <p className="text-xs md:text-sm text-gray-600 mt-2">Click Review to access the full transcript, AI replies, and a detailed meeting summary.</p>
//               </div>

//               <div className="p-4 md:p-6">
//                 {sessions.map((session) => (
//                   <div key={session.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-200 mb-3 gap-4">
//                     <div className="flex items-start lg:items-center gap-3 md:gap-4 flex-1 min-w-0">
//                       <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
//                         <Calendar className="w-5 h-5 text-blue-600" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <h3 className="font-medium text-gray-900 mb-1">{session.name}</h3>
//                         <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
//                           <div className="text-xs md:text-sm text-gray-500">{session.description}</div>
//                           <div className="text-xs md:text-sm text-gray-500 whitespace-nowrap">{session.date}</div>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2 self-end lg:self-auto">
//                       <button 
//                         onClick={() => handleReviewClick(session)}
//                         className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
//                       >
//                         <MessageSquare className="w-4 h-4" />
//                         <span className="hidden sm:inline">Review</span>
//                       </button>
//                       <button className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
//                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Review Modal */}
//         {showReviewModal && selectedSession && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
//               <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
//                 <h2 className="text-lg md:text-xl font-bold truncate pr-4">{selectedSession.name} - Review</h2>
//                 <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <div className="border-b border-gray-200 flex-shrink-0 overflow-x-auto">
//                 <div className="flex gap-2 md:gap-4 px-4 md:px-6 min-w-max">
//                   <button className="px-3 md:px-4 py-3 text-xs md:text-sm text-gray-600 hover:text-gray-900 border-b-2 border-transparent whitespace-nowrap">
//                     <FileText className="w-4 h-4 inline mr-2" />
//                     <span className="hidden sm:inline">Transcript</span>
//                   </button>
//                   <button 
//                     className={`px-3 md:px-4 py-3 text-xs md:text-sm whitespace-nowrap ${activeTab === 'answers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'}`}
//                     onClick={() => setActiveTab('answers')}
//                   >
//                     <MessageSquare className="w-4 h-4 inline mr-2" />
//                     <span className="hidden sm:inline">Answers</span>
//                   </button>
//                   <button className="px-3 md:px-4 py-3 text-xs md:text-sm text-gray-600 hover:text-gray-900 border-b-2 border-transparent whitespace-nowrap">
//                     <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                     </svg>
//                     <span className="hidden sm:inline">Ask JarWiz</span>
//                   </button>
//                   <button className="px-3 md:px-4 py-3 text-xs md:text-sm text-gray-600 hover:text-gray-900 border-b-2 border-transparent whitespace-nowrap">
//                     <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
//                     </svg>
//                     <span className="hidden sm:inline">Summary</span>
//                   </button>
//                 </div>
//               </div>

//               <div className="p-4 md:p-6 overflow-y-auto flex-1">
//                 {selectedSession.transcript.map((msg, idx) => (
//                   <div key={idx} className={`mb-4 md:mb-6 border-l-4 ${msg.isUser ? 'border-blue-500' : 'border-green-500'} pl-3 md:pl-4`}>
//                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
//                       <span className={`font-semibold text-sm md:text-base ${msg.isUser ? 'text-blue-600' : 'text-green-600'}`}>
//                         {msg.sender}
//                       </span>
//                       <span className="text-xs md:text-sm text-gray-500">{msg.time}</span>
//                     </div>
//                     <p className="text-sm md:text-base text-gray-700">{msg.message}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Create Session Modal */}
//         {showCreateModal && (
//           <CreateSessionModal 
//             onClose={() => setShowCreateModal(false)}
//             onCreate={handleCreateSession}
//           />
//         )}
//       </div>
//     );
//   }

//   // Agent Store Page
//   if (currentPage === 'agent-store') {
//     const currentAgents = activeAgentTab === 'predefined' ? predefinedAgents : myAgents;
    
//     return (
//       <div className="flex h-screen bg-gray-50 overflow-hidden">
//         {/* Mobile Menu Overlay */}
//         {showMobileMenu && (
//           <div 
//             className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//             onClick={() => setShowMobileMenu(false)}
//           />
//         )}

//         {/* Left Sidebar */}
//         <div className={`
//           fixed lg:static inset-y-0 left-0 z-50
//           w-64 lg:w-56 bg-white border-r border-gray-200 flex flex-col
//           transform transition-transform duration-300 ease-in-out
//           ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//         `}>
//           <div className="p-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3 flex-1 min-w-0">
//                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
//                   <User className="w-5 h-5 text-blue-600" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="text-sm font-semibold text-gray-900 truncate">vanshaj kerni</div>
//                   <div className="text-xs text-gray-500 truncate">masamuno18@gmail.com</div>
//                 </div>
//               </div>
//               <button 
//                 onClick={() => setShowMobileMenu(false)}
//                 className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           <nav className="flex-1 p-3 overflow-y-auto">
//             <button 
//               onClick={() => navigateToPage('home')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1"
//             >
//               <Home className="w-4 h-4 flex-shrink-0" />
//               <span>Home</span>
//             </button>
//             <button 
//               onClick={() => navigateToPage('sessions')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1"
//             >
//               <Calendar className="w-4 h-4 flex-shrink-0" />
//               <span>Sessions</span>
//             </button>
//             <button 
//               onClick={() => navigateToPage('knowledge-base')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1"
//             >
//               <BookOpen className="w-4 h-4 flex-shrink-0" />
//               <span>Knowledge Base</span>
//             </button>
//             <button 
//               onClick={() => navigateToPage('agent-store')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg mb-1"
//             >
//               <Store className="w-4 h-4 flex-shrink-0" />
//               <span>Agent Store</span>
//             </button>
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
//               <FileText className="w-4 h-4 flex-shrink-0" />
//               <span>Templates</span>
//             </button>
//           </nav>

//           <div className="p-3 border-t border-gray-200">
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1">
//               <Settings className="w-4 h-4 flex-shrink-0" />
//               <span>Settings</span>
//             </button>
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
//               <LogOut className="w-4 h-4 flex-shrink-0" />
//               <span>Sign Out</span>
//             </button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 overflow-auto">
//           {/* Mobile Header */}
//           <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
//             <div className="flex items-center justify-between">
//               <button 
//                 onClick={() => setShowMobileMenu(true)}
//                 className="p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <Menu className="w-6 h-6" />
//               </button>
//               <h1 className="text-lg font-bold text-gray-900">Agent Store</h1>
//               {activeAgentTab === 'my' && (
//                 <button 
//                   onClick={() => setShowCreateAgentModal(true)}
//                   className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//                 >
//                   <Plus className="w-5 h-5" />
//                 </button>
//               )}
//             </div>
//           </div>

//           <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
//             <div className="mb-6 md:mb-8">
//               <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Agent Store</h1>
//               <p className="text-sm md:text-base text-gray-600">Discover pre-defined agents or create custom ones for your needs</p>
//             </div>

//             {/* Tabs */}
//             <div className="flex gap-3 mb-6">
//               <button
//                 onClick={() => setActiveAgentTab('predefined')}
//                 className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg transition-colors ${
//                   activeAgentTab === 'predefined'
//                     ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
//                     : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                 }`}
//               >
//                 <Bot className="w-4 h-4" />
//                 <span className="font-medium text-sm md:text-base">Pre-defined agents</span>
//               </button>
//               <button
//                 onClick={() => setActiveAgentTab('my')}
//                 className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg transition-colors ${
//                   activeAgentTab === 'my'
//                     ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
//                     : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                 }`}
//               >
//                 <Store className="w-4 h-4" />
//                 <span className="font-medium text-sm md:text-base">My agents</span>
//               </button>
//             </div>

//             {/* Agent Library */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//               <div className="p-4 md:p-6 border-b border-gray-200">
//                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                   <div className="flex items-center gap-2">
//                     <h2 className="text-lg font-semibold text-gray-900">
//                       {activeAgentTab === 'predefined' ? 'Pre-defined agents' : 'My Agents'}
//                     </h2>
//                     <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 flex-shrink-0">?</div>
//                   </div>
//                   {activeAgentTab === 'my' && (
//                     <button 
//                       onClick={() => {
//                         setSelectedAgent(null);
//                         setShowCreateAgentModal(true);
//                       }}
//                       className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
//                     >
//                       <Plus className="w-4 h-4" />
//                       Create Agent
//                     </button>
//                   )}
//                 </div>
//                 <p className="text-xs md:text-sm text-gray-600 mt-2">
//                   {activeAgentTab === 'predefined' 
//                     ? 'Ready-to-use, situation-specific, 1-click agents for common meeting tasks.'
//                     : 'Create one-click, situation-specific agents for tasks you expect will come up in meetings.'
//                   }
//                 </p>
//               </div>

//               <div className="p-4 md:p-6">
//                 {currentAgents.length === 0 ? (
//                   <div className="text-center py-12 text-gray-500">
//                     <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
//                     <p className="mb-2 font-medium">No custom agents yet</p>
//                     <p className="text-sm mb-4">Create your first AI agent to get started.</p>
//                     <button
//                       onClick={() => setShowCreateAgentModal(true)}
//                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//                     >
//                       Create Agent
//                     </button>
//                   </div>
//                 ) : (
//                   currentAgents.map((agent) => (
//                     <div 
//                       key={agent.id} 
//                       className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-200 mb-3 cursor-pointer"
//                       onClick={() => {
//                         setSelectedAgent(agent);
//                         setShowAgentDetailsModal(true);
//                       }}
//                     >
//                       <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
//                         <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
//                           <Bot className="w-5 h-5 text-blue-600" />
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <h3 className="font-medium text-gray-900 mb-1">{agent.name}</h3>
//                           <p className="text-xs md:text-sm text-gray-500 truncate">{agent.description}</p>
//                         </div>
//                         <div className="hidden md:block text-sm text-gray-500">
//                           {agent.tags.length > 0 ? agent.tags.join(', ') : 'No tag'}
//                         </div>
//                       </div>
//                       {activeAgentTab === 'my' && (
//                         <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
//                           <button 
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setShowAgentMenu(showAgentMenu === agent.id ? null : agent.id);
//                             }}
//                             className="p-2 hover:bg-gray-100 rounded-lg"
//                           >
//                             <MoreVertical className="w-5 h-5 text-gray-400" />
//                           </button>
//                           {showAgentMenu === agent.id && (
//                             <>
//                               <div 
//                                 className="fixed inset-0 z-10"
//                                 onClick={() => setShowAgentMenu(null)}
//                               />
//                               <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
//                                 <button
//                                   onClick={() => {
//                                     setSelectedAgent(agent);
//                                     setShowCreateAgentModal(true);
//                                     setShowAgentMenu(null);
//                                   }}
//                                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                                 >
//                                   <Edit className="w-4 h-4" />
//                                   Edit
//                                 </button>
//                                 <button
//                                   onClick={() => handleDeleteAgent(agent)}
//                                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
//                                 >
//                                   <Trash className="w-4 h-4" />
//                                   Delete
//                                 </button>
//                               </div>
//                             </>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Create/Edit Agent Modal */}
//         {showCreateAgentModal && (
//           <CreateAgentModal
//             agent={selectedAgent}
//             onClose={() => {
//               setShowCreateAgentModal(false);
//               setSelectedAgent(null);
//             }}
//             onCreate={handleCreateAgent}
//             onUpdate={handleEditAgent}
//           />
//         )}

//         {/* Agent Details Modal */}
//         {showAgentDetailsModal && selectedAgent && (
//           <AgentDetailsModal
//             agent={selectedAgent}
//             onClose={() => {
//               setShowAgentDetailsModal(false);
//               setSelectedAgent(null);
//             }}
//           />
//         )}
//       </div>
//     );
//   }

//   // Knowledge Base Page
//   if (currentPage === 'knowledge-base') {
//     const currentItems = activeKBTab === 'documents' ? documents : cueCards;
    
//     return (
//       <div className="flex h-screen bg-gray-50 overflow-hidden">
//         {/* Mobile Menu Overlay */}
//         {showMobileMenu && (
//           <div 
//             className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//             onClick={() => setShowMobileMenu(false)}
//           />
//         )}

//         {/* Left Sidebar - Same as Sessions */}
//         <div className={`
//           fixed lg:static inset-y-0 left-0 z-50
//           w-64 lg:w-56 bg-white border-r border-gray-200 flex flex-col
//           transform transition-transform duration-300 ease-in-out
//           ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//         `}>
//           <div className="p-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3 flex-1 min-w-0">
//                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
//                   <User className="w-5 h-5 text-blue-600" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="text-sm font-semibold text-gray-900 truncate">vanshaj kerni</div>
//                   <div className="text-xs text-gray-500 truncate">masamuno18@gmail.com</div>
//                 </div>
//               </div>
//               <button 
//                 onClick={() => setShowMobileMenu(false)}
//                 className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           <nav className="flex-1 p-3 overflow-y-auto">
//             <button 
//               onClick={() => navigateToPage('home')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1"
//             >
//               <Home className="w-4 h-4 flex-shrink-0" />
//               <span>Home</span>
//             </button>
//             <button 
//               onClick={() => navigateToPage('sessions')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1"
//             >
//               <Calendar className="w-4 h-4 flex-shrink-0" />
//               <span>Sessions</span>
//             </button>
//             <button 
//               onClick={() => navigateToPage('knowledge-base')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg mb-1"
//             >
//               <BookOpen className="w-4 h-4 flex-shrink-0" />
//               <span>Knowledge Base</span>
//             </button>
//             <button 
//               onClick={() => navigateToPage('agent-store')}
//               className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1"
//             >
//               <Store className="w-4 h-4 flex-shrink-0" />
//               <span>Agent Store</span>
//             </button>
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
//               <FileText className="w-4 h-4 flex-shrink-0" />
//               <span>Templates</span>
//             </button>
//           </nav>

//           <div className="p-3 border-t border-gray-200">
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-1">
//               <Settings className="w-4 h-4 flex-shrink-0" />
//               <span>Settings</span>
//             </button>
//             <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
//               <LogOut className="w-4 h-4 flex-shrink-0" />
//               <span>Sign Out</span>
//             </button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 overflow-auto">
//           {/* Mobile Header */}
//           <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
//             <div className="flex items-center justify-between">
//               <button 
//                 onClick={() => setShowMobileMenu(true)}
//                 className="p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <Menu className="w-6 h-6" />
//               </button>
//               <h1 className="text-lg font-bold text-gray-900">Knowledge Base</h1>
//               <button 
//                 onClick={() => setShowUploadModal(true)}
//                 className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 <Plus className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
//             <div className="mb-6 md:mb-8">
//               <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
//               <p className="text-sm md:text-base text-gray-600">Store and manage all your prep materials in one place</p>
//             </div>

//             {/* Tabs */}
//             <div className="flex gap-3 mb-6">
//               <button
//                 onClick={() => setActiveKBTab('documents')}
//                 className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg transition-colors ${
//                   activeKBTab === 'documents'
//                     ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
//                     : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                 }`}
//               >
//                 <FileIcon className="w-4 h-4" />
//                 <span className="font-medium text-sm md:text-base">Documents</span>
//               </button>
//               <button
//                 onClick={() => setActiveKBTab('cuecards')}
//                 className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg transition-colors ${
//                   activeKBTab === 'cuecards'
//                     ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
//                     : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                 }`}
//               >
//                 <GraduationCap className="w-4 h-4" />
//                 <span className="font-medium text-sm md:text-base">Cue Card</span>
//               </button>
//             </div>

//             {/* Document/Cue Card Library */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//               <div className="p-4 md:p-6 border-b border-gray-200">
//                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                   <div className="flex items-center gap-2">
//                     <h2 className="text-lg font-semibold text-gray-900">
//                       {activeKBTab === 'documents' ? 'Document Library' : 'Cue Card Library'}
//                     </h2>
//                     <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 flex-shrink-0">?</div>
//                   </div>
//                   <button 
//                     onClick={() => setShowUploadModal(true)}
//                     className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
//                   >
//                     <Plus className="w-4 h-4" />
//                     Upload {activeKBTab === 'documents' ? 'Document' : 'Cue Card'}
//                   </button>
//                 </div>
//                 <p className="text-xs md:text-sm text-gray-600 mt-2">
//                   JarWiz will use the files to provide instant, context-aware assistance during meetings.
//                 </p>
//               </div>

//               <div className="p-4 md:p-6">
//                 {currentItems.length === 0 ? (
//                   <div className="text-center py-12 text-gray-500">
//                     <FileIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
//                     <p>No {activeKBTab === 'documents' ? 'documents' : 'cue cards'} yet</p>
//                     <button
//                       onClick={() => setShowUploadModal(true)}
//                       className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//                     >
//                       Upload {activeKBTab === 'documents' ? 'Document' : 'Cue Card'}
//                     </button>
//                   </div>
//                 ) : (
//                   currentItems.map((item) => (
//                     <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-200 mb-3">
//                       <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
//                         <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
//                           <FileIcon className="w-5 h-5 text-blue-600" />
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
//                           <p className="text-xs md:text-sm text-gray-500">{item.description}</p>
//                         </div>
//                       </div>
//                       <div className="relative flex-shrink-0">
//                         <button 
//                           onClick={() => setShowDocMenu(showDocMenu === item.id ? null : item.id)}
//                           className="p-2 hover:bg-gray-100 rounded-lg"
//                         >
//                           <MoreVertical className="w-5 h-5 text-gray-400" />
//                         </button>
//                         {showDocMenu === item.id && (
//                           <>
//                             <div 
//                               className="fixed inset-0 z-10"
//                               onClick={() => setShowDocMenu(null)}
//                             />
//                             <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
//                               <button
//                                 onClick={() => {
//                                   setSelectedDocument(item);
//                                   setShowEditModal(true);
//                                   setShowDocMenu(null);
//                                 }}
//                                 className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                               >
//                                 <Edit className="w-4 h-4" />
//                                 Edit
//                               </button>
//                               <button
//                                 onClick={() => handleDeleteDocument(item)}
//                                 className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
//                               >
//                                 <Trash className="w-4 h-4" />
//                                 Delete
//                               </button>
//                             </div>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Upload Modal */}
//         {showUploadModal && (
//           <UploadDocumentModal
//             onClose={() => setShowUploadModal(false)}
//             onUpload={handleUploadDocument}
//             type={activeKBTab}
//           />
//         )}

//         {/* Edit Modal */}
//         {showEditModal && selectedDocument && (
//           <EditDocumentModal
//             document={selectedDocument}
//             onClose={() => {
//               setShowEditModal(false);
//               setSelectedDocument(null);
//             }}
//             onUpdate={handleEditDocument}
//           />
//         )}
//       </div>
//     );
//   }

//   // Active Session Page
//   if (currentPage === 'active-session') {
//     return (
//       <div className="flex flex-col lg:flex-row h-screen bg-gray-900">
//         {/* Left Column - Video Integration */}
//         <div className="flex-1 flex flex-col min-h-0">
//           <div className="p-3 md:p-4 flex items-center justify-between bg-gray-800 flex-shrink-0">
//             <div className="flex items-center gap-2 md:gap-3 min-w-0">
//               <Video className="w-4 md:w-5 h-4 md:h-5 text-white flex-shrink-0" />
//               <h2 className="text-white font-semibold text-sm md:text-base truncate">Meeting Session</h2>
//             </div>
//             <button 
//               onClick={() => handleExitSession()}
//               className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base whitespace-nowrap flex-shrink-0"
//             >
//               <LogOut className="w-3 md:w-4 h-3 md:h-4" />
//               <span className="hidden sm:inline">Exit</span>
//             </button>
//           </div>

//           <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-auto p-4">
//             <div className="text-center max-w-md w-full">
//               <div className="w-16 md:w-24 h-16 md:h-24 bg-gray-700 rounded-full mx-auto mb-3 md:mb-4 flex items-center justify-center">
//                 <Video className="w-8 md:w-12 h-8 md:h-12 text-gray-400" />
//               </div>
//               <p className="text-gray-400 mb-3 md:mb-4 text-sm md:text-base">No active meeting connected</p>
//               <button className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto text-sm md:text-base">
//                 <Video className="w-4 md:w-5 h-4 md:h-5" />
//                 Connect to Meeting
//               </button>
//             </div>

//             {/* Connection Instructions */}
//             <div className="absolute bottom-4 left-4 right-4 bg-gray-800 p-3 md:p-4 rounded-lg text-xs md:text-sm text-gray-300 max-w-2xl mx-auto">
//               <h3 className="font-semibold mb-2">How to Connect:</h3>
//               <ol className="list-decimal list-inside space-y-1">
//                 <li>Click on 'Connect to Meeting' button</li>
//                 <li>Choose the tab showing your Google Meet, Zoom, or Teams meeting</li>
//                 <li>Make sure to select the "Auto share the tab audio" option</li>
//                 <li>Click on 'Share' button</li>
//               </ol>
//             </div>
//           </div>
//         </div>

//         {/* Right Column - Chat */}
//         <div className="w-full lg:w-96 bg-white flex flex-col border-l border-gray-200 max-h-[50vh] lg:max-h-full">
//           <div className="p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
//             <h3 className="font-semibold text-gray-900 text-sm md:text-base">AI Answer</h3>
//             <p className="text-xs md:text-sm text-gray-600 mt-1">Ask JarWiz for any session related query, answer, assistance...</p>
//           </div>

//           <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 min-h-0">
//             {chatMessages.length === 0 ? (
//               <div className="text-center text-gray-400 mt-8 md:mt-12">
//                 <MessageSquare className="w-10 md:w-12 h-10 md:h-12 mx-auto mb-3 text-gray-300" />
//                 <p className="text-sm md:text-base">AI will start to appear here...</p>
//               </div>
//             ) : (
//               chatMessages.map((msg, idx) => (
//                 <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
//                   <div className={`max-w-[85%] md:max-w-[80%] rounded-lg p-2 md:p-3 ${msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
//                     <p className="text-xs md:text-sm">{msg.text}</p>
//                     <p className={`text-xs mt-1 ${msg.isUser ? 'text-blue-100' : 'text-gray-500'}`}>{msg.time}</p>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           <div className="p-3 md:p-4 border-t border-gray-200 flex-shrink-0">
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={chatInput}
//                 onChange={(e) => setChatInput(e.target.value)}
//                 onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
//                 placeholder="Ask JarWiz..."
//                 className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
//               />
//               <button 
//                 onClick={handleSendMessage}
//                 className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
//               >
//                 <Send className="w-4 md:w-5 h-4 md:h-5" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return null;
// };

// const UploadDocumentModal = ({ onClose, onUpload, type }) => {
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     file: null
//   });
//   const [error, setError] = useState('');

//   const handleSubmit = () => {
//     if (!formData.title.trim()) {
//       setError('Document title is required');
//       return;
//     }
//     onUpload(formData);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
//           <h2 className="text-lg md:text-xl font-bold">Upload {type === 'documents' ? 'Document' : 'Cue Card'}</h2>
//           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="p-4 md:p-6 space-y-4 md:space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Document Title</label>
//             <input
//               type="text"
//               value={formData.title}
//               onChange={(e) => {
//                 setFormData({ ...formData, title: e.target.value });
//                 setError('');
//               }}
//               placeholder="Enter document title"
//               className={`w-full px-3 md:px-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'} text-sm md:text-base`}
//             />
//             {error && (
//               <p className="text-red-600 text-xs mt-1">{error}</p>
//             )}
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
//             <textarea
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               placeholder="Add a description to help AI use this file effectively in meetings. More detail means better answers.

// e.g., Pitch deck_Acme: includes features, pricing, competitor comparison, business plan
// e.g., Job Description: Data Analyst role with required skills and responsibilities"
//               rows={6}
//               className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Select PDF File</label>
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
//               <input
//                 type="file"
//                 accept=".pdf"
//                 onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
//                 className="hidden"
//                 id="file-upload"
//               />
//               <label htmlFor="file-upload" className="cursor-pointer">
//                 <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
//                 <p className="text-sm text-gray-600 mb-1">
//                   {formData.file ? formData.file.name : 'Click to choose file or drag and drop'}
//                 </p>
//                 <p className="text-xs text-gray-500">PDF files only</p>
//               </label>
//             </div>
//           </div>
//         </div>

//         <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
//           <button 
//             onClick={onClose}
//             className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
//           >
//             Cancel
//           </button>
//           <button 
//             onClick={handleSubmit}
//             className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base flex items-center justify-center gap-2"
//           >
//             <Upload className="w-4 h-4" />
//             Upload {type === 'documents' ? 'Document' : 'Cue Card'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const CreateAgentModal = ({ agent, onClose, onCreate, onUpdate }) => {
//   const [formData, setFormData] = useState({
//     name: agent?.name || '',
//     description: agent?.description || '',
//     tags: agent?.tags?.join(', ') || '',
//     prompt: agent?.prompt || '',
//     guardrails: agent?.guardrails || ''
//   });
//   const [error, setError] = useState('');

//   const handleSubmit = () => {
//     if (!formData.name.trim()) {
//       setError('Agent name is required');
//       return;
//     }
//     if (agent) {
//       onUpdate(formData);
//     } else {
//       onCreate(formData);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
//         <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
//           <h2 className="text-lg md:text-xl font-bold">{agent ? 'Edit Agent' : 'Create Agent'}</h2>
//           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="p-4 md:p-6 space-y-4 md:space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">
//               Agent Name <span className="text-red-600">*</span>
//             </label>
//             <input
//               type="text"
//               value={formData.name}
//               onChange={(e) => {
//                 setFormData({ ...formData, name: e.target.value });
//                 setError('');
//               }}
//               placeholder="e.g., Sales Pitch Assistant"
//               className={`w-full px-3 md:px-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'} text-sm md:text-base`}
//             />
//             {error && (
//               <p className="text-red-600 text-xs mt-1">{error}</p>
//             )}
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
//             <input
//               type="text"
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               placeholder="Brief description of what this agent does"
//               className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Tag</label>
//             <input
//               type="text"
//               value={formData.tags}
//               onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
//               placeholder="e.g., Sales, Business (comma-separated)"
//               className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Agent Prompt</label>
//             <textarea
//               value={formData.prompt}
//               onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
//               placeholder="Define the agent's behavior, expertise, and how it should respond to queries..."
//               rows={8}
//               className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">
//               <div className="flex items-center gap-2">
//                 <Shield className="w-4 h-4" />
//                 <span>Guardrails (Optional)</span>
//               </div>
//             </label>
//             <textarea
//               value={formData.guardrails}
//               onChange={(e) => setFormData({ ...formData, guardrails: e.target.value })}
//               placeholder="Define limitations, ethical guidelines, or constraints for the agent..."
//               rows={4}
//               className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
//             />
//           </div>
//         </div>

//         <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
//           <button 
//             onClick={onClose}
//             className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
//           >
//             Cancel
//           </button>
//           <button 
//             onClick={handleSubmit}
//             className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
//           >
//             {agent ? 'Update Agent' : 'Create Agent'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const AgentDetailsModal = ({ agent, onClose }) => {
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
//         <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
//           <h2 className="text-lg md:text-xl font-bold">Agent Details</h2>
//           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="p-4 md:p-6 space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
//             <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
//               <p className="text-gray-900">{agent.name}</p>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
//             <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
//               <p className="text-gray-900">{agent.description}</p>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
//             <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
//               <p className="text-gray-900">{agent.tags.length > 0 ? agent.tags.join(', ') : 'No tag'}</p>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Agent Prompt</label>
//             <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
//               <p className="text-gray-900 whitespace-pre-wrap text-sm">{agent.prompt}</p>
//             </div>
//           </div>

//           {agent.guardrails && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
//                 <Shield className="w-4 h-4" />
//                 Guardrails
//               </label>
//               <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
//                 <p className="text-gray-900 whitespace-pre-wrap text-sm">{agent.guardrails}</p>
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="p-4 md:p-6 border-t border-gray-200 sticky bottom-0 bg-white">
//           <button 
//             onClick={onClose}
//             className="w-full px-4 md:px-6 py-2 md:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base font-medium"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const EditDocumentModal = ({ document, onClose, onUpdate }) => {
//   const [formData, setFormData] = useState({
//     title: document.title,
//     description: document.description
//   });

//   const handleSubmit = () => {
//     if (!formData.title.trim()) {
//       return;
//     }
//     onUpdate(formData);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
//           <h2 className="text-lg md:text-xl font-bold">Edit Document</h2>
//           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="p-4 md:p-6 space-y-4 md:space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Document Title</label>
//             <input
//               type="text"
//               value={formData.title}
//               onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//               className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
//             <textarea
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               placeholder="Add a description to help AI use this file effectively in meetings. More detail means better answers.

// e.g., Pitch deck_Acme: includes features, pricing, competitor comparison, business plan
// e.g., Job Description: Data Analyst role with required skills and responsibilities"
//               rows={6}
//               className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
//             />
//           </div>
//         </div>

//         <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
//           <button 
//             onClick={onClose}
//             className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
//           >
//             Cancel
//           </button>
//           <button 
//             onClick={handleSubmit}
//             className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
//           >
//             Update Document
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const CreateSessionModal = ({ onClose, onCreate }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     template: '',
//     description: '',
//     documents: '',
//     cueCard: '',
//     agents: {
//       competitor: false,
//       whatToSay: false,
//       gtm: false
//     }
//   });
//   const [error, setError] = useState('');

//   const handleSubmit = () => {
//     if (!formData.name.trim()) {
//       setError('Session name is required');
//       return;
//     }
//     onCreate(formData);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
//           <h2 className="text-lg md:text-xl font-bold">Create New Session</h2>
//           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="p-4 md:p-6 space-y-4 md:space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">
//               Session Name <span className="text-red-600">*</span>
//             </label>
//             <input
//               type="text"
//               value={formData.name}
//               onChange={(e) => {
//                 setFormData({ ...formData, name: e.target.value });
//                 setError('');
//               }}
//               placeholder="Enter session name"
//               className={`w-full px-3 md:px-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'} text-sm md:text-base`}
//             />
//             {error && (
//               <p className="text-red-600 text-xs mt-1">{error}</p>
//             )}
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Meeting Template</label>
//             <div className="relative">
//               <select 
//                 value={formData.template}
//                 onChange={(e) => setFormData({ ...formData, template: e.target.value })}
//                 className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
//               >
//                 <option value="">-- Select a template --</option>
//                 <option value="sales">Sales Meeting</option>
//                 <option value="standup">Daily Standup</option>
//                 <option value="review">Review Meeting</option>
//               </select>
//               <ChevronDown className="absolute right-3 top-2.5 md:top-3 w-4 md:w-5 h-4 md:h-5 text-gray-400 pointer-events-none" />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
//             <textarea
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               placeholder="Provide detailed info like purpose, goals, agenda, participants or any additional info. More detail will mean better answers.

// e.g., Pitch ABC product to XYZ Corp.
// Goal: secure pilot project.
// Agenda: product demo + pricing discussion.
// Participant: Procurement Head.
// Background: shared proposal last week (abc.pdf), awaiting budget approval"
//               rows={6}
//               className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Additional Documents</label>
//             <div className="relative">
//               <select 
//                 value={formData.documents}
//                 onChange={(e) => setFormData({ ...formData, documents: e.target.value })}
//                 className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
//               >
//                 <option value="">-- Select documents --</option>
//               </select>
//               <ChevronDown className="absolute right-3 top-2.5 md:top-3 w-4 md:w-5 h-4 md:h-5 text-gray-400 pointer-events-none" />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-2">Cue Cards</label>
//             <div className="relative">
//               <select 
//                 value={formData.cueCard}
//                 onChange={(e) => setFormData({ ...formData, cueCard: e.target.value })}
//                 className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
//               >
//                 <option value="">-- Select a cue card --</option>
//               </select>
//               <ChevronDown className="absolute right-3 top-2.5 md:top-3 w-4 md:w-5 h-4 md:h-5 text-gray-400 pointer-events-none" />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-900 mb-3">AI Agents</label>
//             <div className="border border-gray-300 rounded-lg p-3 md:p-4">
//               <div className="text-xs font-medium text-gray-500 mb-3">DEFAULT AGENTS</div>
//               <div className="space-y-3">
//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={formData.agents.competitor}
//                     onChange={(e) => setFormData({ 
//                       ...formData, 
//                       agents: { ...formData.agents, competitor: e.target.checked }
//                     })}
//                     className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
//                   />
//                   <span className="text-sm text-gray-900">Competitor Analysis Agent</span>
//                 </label>
//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={formData.agents.whatToSay}
//                     onChange={(e) => setFormData({ 
//                       ...formData, 
//                       agents: { ...formData.agents, whatToSay: e.target.checked }
//                     })}
//                     className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
//                   />
//                   <span className="text-sm text-gray-900">What to say next?</span>
//                 </label>
//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={formData.agents.gtm}
//                     onChange={(e) => setFormData({ 
//                       ...formData, 
//                       agents: { ...formData.agents, gtm: e.target.checked }
//                     })}
//                     className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
//                   />
//                   <span className="text-sm text-gray-900">GTM Advisor</span>
//                 </label>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
//           <button 
//             onClick={onClose}
//             className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
//           >
//             Cancel
//           </button>
//           <button 
//             onClick={handleSubmit}
//             className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
//           >
//             Create Session
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SessionManagementApp;