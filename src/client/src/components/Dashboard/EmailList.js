import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmail } from '../../contexts/EmailContext';
import { 
  Star, 
  Paperclip, 
  Circle,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Trash2,
  Archive,
  MoreVertical,
  Mail,
  MailOpen
} from 'lucide-react';

const EmailList = ({ currentView }) => {
  const navigate = useNavigate();
  const { 
    getEmailsByType, 
    loading,
    deleteEmail,
    starEmail,
    unstarEmail,
    markAsRead,
    markAsUnread,
    archiveEmail
  } = useEmail();
  
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [showActions, setShowActions] = useState(null);
  
  const emails = getEmailsByType(currentView);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'received':
        return <Circle className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEmailDisplayName = (email, currentView) => {
    switch (currentView) {
      case 'sent':
      case 'drafts':
        return email.to_email;
      default:
        return email.from_email;
    }
  };

  const handleEmailClick = (email) => {
    // Navigate to detailed email view
    navigate(`/dashboard/mail/${email._id}`);
    
    // Mark as read when opened
    if (!email.read && email.status === 'received') {
      markAsRead(email._id);
    }
  };

  const handleCheckboxChange = (emailId, checked) => {
    const newSelected = new Set(selectedEmails);
    if (checked) {
      newSelected.add(emailId);
    } else {
      newSelected.delete(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEmails(new Set(emails.map(email => email._id)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleStarToggle = async (e, email) => {
    e.stopPropagation();
    if (email.starred) {
      await unstarEmail(email._id);
    } else {
      await starEmail(email._id);
    }
  };

  const handleDelete = async (emailId) => {
    const result = await deleteEmail(emailId);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleArchive = async (emailId) => {
    const result = await archiveEmail(emailId);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleMarkAsRead = async (emailId) => {
    await markAsRead(emailId);
  };

  const handleMarkAsUnread = async (emailId) => {
    await markAsUnread(emailId);
  };

  const bulkDelete = async () => {
    for (const emailId of selectedEmails) {
      await deleteEmail(emailId);
    }
    setSelectedEmails(new Set());
  };

  const bulkArchive = async () => {
    for (const emailId of selectedEmails) {
      await archiveEmail(emailId);
    }
    setSelectedEmails(new Set());
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'No content';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gmail-blue"></div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-medium mb-2">No emails in {currentView}</h3>
        <p className="text-sm">Your {currentView} folder is empty.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Email List Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={selectedEmails.size === emails.length && emails.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-gray-300 text-gmail-blue focus:ring-gmail-blue"
          />
          
          {selectedEmails.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={bulkDelete}
                className="p-1 hover:bg-gray-100 rounded text-red-600"
                title="Delete selected"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={bulkArchive}
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                title="Archive selected"
              >
                <Archive className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {selectedEmails.size > 0 
            ? `${selectedEmails.size} selected` 
            : `${emails.length} ${emails.length === 1 ? 'email' : 'emails'}`
          }
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.map((email) => (
          <div
            key={email._id}
            onClick={() => handleEmailClick(email)}
            className={`email-list-item flex items-center p-4 border-b border-gray-100 cursor-pointer transition-colors relative group hover:bg-gray-50 ${
              !email.read && email.status === 'received' ? 'bg-blue-50' : ''
            }`}
          >
            {/* Checkbox */}
            <div className="flex items-center space-x-3 mr-4">
              <input
                type="checkbox"
                checked={selectedEmails.has(email._id)}
                onChange={(e) => handleCheckboxChange(email._id, e.target.checked)}
                className="rounded border-gray-300 text-gmail-blue focus:ring-gmail-blue"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => handleStarToggle(e, email)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Star className={`h-4 w-4 ${email.starred ? 'text-yellow-400 fill-current' : 'text-gray-400'} hover:text-yellow-400`} />
              </button>
            </div>

            {/* Status Icon */}
            <div className="mr-3 flex items-center space-x-1">
              {getStatusIcon(email.status)}
              {!email.read && email.status === 'received' && (
                <Mail className="h-3 w-3 text-blue-600" />
              )}
            </div>

            {/* Email Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className={`truncate ${!email.read && email.status === 'received' ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                    {getEmailDisplayName(email, currentView)}
                  </span>
                  {email.attachments && email.attachments.length > 0 && (
                    <Paperclip className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 ml-2">
                    {formatDate(email.created_at)}
                  </span>
                  
                  {/* Action Menu */}
                  <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActions(showActions === email._id ? null : email._id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {showActions === email._id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            email.read ? handleMarkAsUnread(email._id) : handleMarkAsRead(email._id);
                            setShowActions(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          {email.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                          <span>{email.read ? 'Mark as unread' : 'Mark as read'}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(email._id);
                            setShowActions(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Archive className="h-4 w-4" />
                          <span>Archive</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(email._id);
                            setShowActions(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`text-sm mb-1 truncate ${!email.read && email.status === 'received' ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                {email.subject || '(No Subject)'}
              </div>
              
              <div className="text-sm text-gray-600 truncate">
                {truncateText(email.body_text)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailList;