import React from 'react';
import { useEmail } from '../../contexts/EmailContext';
import { 
  Inbox, 
  Send, 
  FileText, 
  AlertTriangle,
  Edit3,
  Star,
  Archive,
  Trash2
} from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView, setShowCompose, setSidebarOpen }) => {
  const { getEmailsByType } = useEmail();

  const menuItems = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      count: getEmailsByType('inbox').length
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: Send,
      count: getEmailsByType('sent').length
    },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: FileText,
      count: getEmailsByType('drafts').length
    },
    {
      id: 'failed',
      label: 'Failed',
      icon: AlertTriangle,
      count: getEmailsByType('failed').length
    }
  ];

  const handleComposeClick = () => {
    setShowCompose(true);
    // Close sidebar on mobile after action
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handleMenuItemClick = (viewId) => {
    setCurrentView(viewId);
    // Close sidebar on mobile after action
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Compose Button */}
      <div className="p-3 sm:p-4">
        <button
          onClick={handleComposeClick}
          className="compose-button w-full flex items-center justify-center space-x-2 bg-gmail-red text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          <Edit3 className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Compose</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuItemClick(item.id)}
                  className={`sidebar-item w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-left rounded-r-full transition-all duration-200 text-sm sm:text-base ${
                    isActive 
                      ? 'active bg-red-50 text-gmail-red border-r-4 border-gmail-red' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? 'text-gmail-red' : 'text-gray-500'}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <span className={`text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                      isActive 
                        ? 'bg-gmail-red text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Additional Menu Items */}
        <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-200">
          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => handleMenuItemClick('starred')}
                className="sidebar-item w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left text-gray-700 hover:bg-gray-100 rounded-r-full transition-all duration-200 text-sm sm:text-base"
              >
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                <span className="font-medium">Starred</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleMenuItemClick('archive')}
                className="sidebar-item w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left text-gray-700 hover:bg-gray-100 rounded-r-full transition-all duration-200 text-sm sm:text-base"
              >
                <Archive className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                <span className="font-medium">Archive</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleMenuItemClick('trash')}
                className="sidebar-item w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left text-gray-700 hover:bg-gray-100 rounded-r-full transition-all duration-200 text-sm sm:text-base"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                <span className="font-medium">Trash</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Storage Info */}
      <div className="p-3 sm:p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex justify-between mb-1">
            <span className="truncate">Storage used</span>
            <span className="text-xs">2.1/15 GB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-gmail-blue h-1 rounded-full" style={{ width: '14%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;