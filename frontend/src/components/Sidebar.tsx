import React from 'react';
import { X, Home, Calendar, BookOpen, Store, FileText, Settings, LogOut, User } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  showMobileMenu: boolean;
  onCloseMobileMenu: () => void;
  onNavigate: (page: string, options?: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, showMobileMenu, onCloseMobileMenu, onNavigate }) => {
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 lg:w-56 bg-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-100">
                <User className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">vanshaj kerni</div>
                <div className="text-xs text-gray-400 truncate">masamuno18@gmail.com</div>
              </div>
            </div>
            <button
              onClick={onCloseMobileMenu}
              className="lg:hidden p-1.5 hover:bg-gray-50 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
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
                    ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg mb-0.5 transition-colors">
            <Settings className="w-4 h-4 flex-shrink-0 text-gray-400" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4 flex-shrink-0 text-gray-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
