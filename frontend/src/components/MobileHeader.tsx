import React from 'react';
import { Menu, Plus } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
  onActionClick?: () => void;
  actionIcon?: React.ReactNode;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onMenuClick,
  onActionClick,
  actionIcon,
}) => {
  return (
    <div className="lg:hidden bg-ivory/80 backdrop-blur-sm border-b-2 border-red-600 p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-medium text-gray-900">{title}</h1>
        {onActionClick ? (
          <button
            onClick={onActionClick}
            className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {actionIcon || <Plus className="w-5 h-5" />}
          </button>
        ) : (
          <div className="w-10"></div>
        )}
      </div>
    </div>
  );
};

export default MobileHeader;
