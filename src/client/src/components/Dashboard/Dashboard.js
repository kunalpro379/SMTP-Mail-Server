import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import EmailList from './EmailList';
import EmailView from './EmailView';
import ComposeEmail from './ComposeEmail';
import { Edit3 } from 'lucide-react';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-0
          fixed inset-y-0 left-0 z-50
          w-64 sm:w-72 lg:w-64
          transition-transform duration-300 ease-in-out
        `}>
          <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView}
            setShowCompose={setShowCompose}
            setSidebarOpen={setSidebarOpen}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Routes>
            <Route 
              path="/" 
              element={<EmailList currentView={currentView} />} 
            />
            <Route 
              path="/mail/:id" 
              element={<EmailView />} 
            />
          </Routes>
        </div>
      </div>

      {/* Floating Compose Button - Bottom Right */}
      <button
        onClick={() => setShowCompose(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 sm:p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 active:scale-95 group"
        title="Compose new email"
        aria-label="Compose new email"
      >
        <Edit3 className="h-6 w-6 sm:h-7 sm:w-7 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
      </button>

      {showCompose && (
        <ComposeEmail 
          onClose={() => setShowCompose(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;