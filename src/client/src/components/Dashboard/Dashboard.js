import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import EmailList from './EmailList';
import EmailView from './EmailView';
import ComposeEmail from './ComposeEmail';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          setShowCompose={setShowCompose}
        />
        
        <div className="flex-1">
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

      {showCompose && (
        <ComposeEmail 
          onClose={() => setShowCompose(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;