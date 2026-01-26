import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { FileText, GraduationCap, Bot, Plus, Calendar } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, options?: any) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const actionCards = [
    {
      icon: FileText,
      title: 'Upload Files',
      description: 'For in-meeting assistance and citations',
      color: 'green',
      onClick: () =>
        onNavigate('knowledge-base', {
          knowledgeBaseTab: 'documents',
          openModal: 'uploadDocument',
        }),
    },
    {
      icon: GraduationCap,
      title: 'Create Cue Cards',
      description: 'For exact, pre-prepared answer recall in meeting',
      color: 'purple',
      onClick: () =>
        onNavigate('knowledge-base', {
          knowledgeBaseTab: 'cuecards',
          openModal: 'uploadDocument',
        }),
    },
    {
      icon: Bot,
      title: 'Setup Agent',
      description: 'To run pre-set actions, instantly, with 1-click.',
      color: 'orange',
      onClick: () => onNavigate('agent-store', { agentTab: 'predefined' }),
    },
    {
      icon: Plus,
      title: 'Start New Session',
      description: 'Join meeting fully prepared and confident',
      color: 'blue',
      onClick: () => onNavigate('sessions', { openModal: 'createSession' }),
    },
    {
      icon: Calendar,
      title: 'Review Meeting',
      description: 'Recap notes, summaries and insights with Jarwiz',
      color: 'indigo',
      onClick: () => onNavigate('sessions'),
    },
  ];

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      <Sidebar
        currentPage="home"
        showMobileMenu={showMobileMenu}
        onCloseMobileMenu={() => setShowMobileMenu(false)}
        onNavigate={onNavigate}
      />

      <div className="flex-1 overflow-auto">
        <MobileHeader
          title="Home"
          onMenuClick={() => setShowMobileMenu(true)}
        />

        <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
          <div className="mb-10 md:mb-14">
            <h1 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-3 tracking-tight">
              Welcome, vanshaj kerni!
            </h1>
            <p className="text-base md:text-lg text-gray-500 mb-3 font-light">
              Ready to ace your next meeting?
            </p>
            <p className="text-sm md:text-base text-gray-400 max-w-2xl">
              Get real-time answers, surface the right documents, recall pre-set responses, and
              background agent support, all in just 1-click.
            </p>
          </div>

          <div className="mb-8 md:mb-10">
            <h2 className="text-lg md:text-xl font-medium text-gray-700 mb-6">
              Get ready for your meeting
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {actionCards.map((card, index) => {
                const Icon = card.icon;
                const colorClasses = {
                  green: 'bg-emerald-50/50 group-hover:bg-emerald-50 text-emerald-600',
                  purple: 'bg-violet-50/50 group-hover:bg-violet-50 text-violet-600',
                  orange: 'bg-amber-50/50 group-hover:bg-amber-50 text-amber-600',
                  blue: 'bg-blue-50/50 group-hover:bg-blue-50 text-blue-600',
                  indigo: 'bg-indigo-50/50 group-hover:bg-indigo-50 text-indigo-600',
                };

                return (
                  <button
                    key={index}
                    onClick={card.onClick}
                    className="group bg-white p-5 rounded-xl hover:shadow-sm transition-all duration-200 text-left border border-gray-100 hover:border-gray-200"
                  >
                    <div
                      className={`w-11 h-11 ${colorClasses[card.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center mb-4 transition-all duration-200 group-hover:scale-105`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1.5 text-sm flex items-center justify-between">
                      {card.title}
                      <svg
                        className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{card.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
