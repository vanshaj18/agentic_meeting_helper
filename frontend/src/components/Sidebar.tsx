import React, { useState } from 'react';
import { X, Home, Calendar, BookOpen, Store, FileText, Settings, LogOut, User } from 'lucide-react';
import SettingsModal from './modals/SettingsModal';
import { useAppContext } from '../context/AppContext';

interface SidebarProps {
  currentPage: string;
  showMobileMenu: boolean;
  onCloseMobileMenu: () => void;
  onNavigate: (page: string, options?: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, showMobileMenu, onCloseMobileMenu, onNavigate }) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { user, setUser } = useAppContext();
  const menuItems = [
    { icon: Home, label: 'Home', page: 'home' },
    { icon: Calendar, label: 'Sessions', page: 'sessions' },
    { icon: BookOpen, label: 'Knowledge Base', page: 'knowledge-base' },
    { icon: Store, label: 'Agent Store', page: 'agent-store' },
    { icon: FileText, label: 'Templates', page: 'templates' },
  ];

  return (
    <>
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-modal-overlay z-40 lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 lg:w-56 bg-ivory flex flex-col border-r-2 border-red-600
          transform transition-transform duration-300 ease-in-out
          ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-5 border-b-2 border-red-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-red-600"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center flex-shrink-0 ring-2 ring-red-600">
                  <User className="w-4.5 h-4.5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                <div className="text-xs text-gray-600 truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={onCloseMobileMenu}
              className="lg:hidden p-1.5 hover:bg-ivory-dark rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => {
                  onNavigate(item.page);
                  onCloseMobileMenu();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mb-0.5 transition-all duration-200 ${
                  isActive
                    ? 'bg-black text-white font-medium shadow-lg border-2 border-red-600'
                    : 'text-gray-700 hover:text-black hover:bg-ivory-dark border-2 border-transparent hover:border-red-600'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t-2 border-red-600">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-ivory-dark rounded-lg mb-0.5 transition-colors border-2 border-transparent hover:border-red-600"
          >
            <Settings className="w-4 h-4 flex-shrink-0 text-gray-600" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-2 border-transparent hover:border-red-600">
            <LogOut className="w-4 h-4 flex-shrink-0 text-gray-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {showSettingsModal && (
        <SettingsModal
          user={user}
          onClose={() => setShowSettingsModal(false)}
          onUpdate={async (data) => {
            // Update user state
            setUser({
              ...user,
              name: data.name,
              image: data.image,
            });
            // Here you would typically make an API call to save the settings
            // For now, we'll just update local state
            setShowSettingsModal(false);
          }}
        />
      )}
    </>
  );
};

export default Sidebar;
