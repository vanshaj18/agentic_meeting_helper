import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import SessionsPage from './pages/SessionsPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import AgentStorePage from './pages/AgentStorePage';
import ActiveSessionPage from './pages/ActiveSessionPage';
import TemplatesPage from './pages/TemplatesPage';

type NavigationOptions = {
  knowledgeBaseTab?: 'documents' | 'cuecards';
  agentTab?: 'predefined' | 'my';
  openModal?: 'createSession' | 'uploadDocument';
};

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [navigationOptions, setNavigationOptions] = useState<NavigationOptions>({});

  const handleNavigate = (page: string, options?: NavigationOptions) => {
    setCurrentPage(page);
    if (options) {
      setNavigationOptions(options);
    } else {
      setNavigationOptions({});
    }
  };

  return (
    <AppProvider>
      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
      {currentPage === 'sessions' && (
        <SessionsPage onNavigate={handleNavigate} initialOptions={navigationOptions} />
      )}
      {currentPage === 'knowledge-base' && (
        <KnowledgeBasePage onNavigate={handleNavigate} initialOptions={navigationOptions} />
      )}
      {currentPage === 'agent-store' && (
        <AgentStorePage onNavigate={handleNavigate} initialOptions={navigationOptions} />
      )}
      {currentPage === 'templates' && <TemplatesPage onNavigate={handleNavigate} />}
      {currentPage === 'active-session' && <ActiveSessionPage onNavigate={handleNavigate} />}
    </AppProvider>
  );
}

export default App;
