import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmail } from '../../contexts/EmailContext';
import ReplyCompose from './ReplyCompose';
import { 
  ArrowLeft, 
  Star, 
  Reply, 
  ReplyAll, 
  Forward, 
  MoreVertical,
  Paperclip,
  Download,
  Trash2,
  Archive,
  X,
  Mail,
  MailOpen,
  Clock,
  Calendar,
  Tag,
  Copy,
  Printer
} from 'lucide-react';

const EmailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    fetchEmail,
    deleteEmail, 
    starEmail, 
    unstarEmail,
    markAsRead,
    markAsUnread,
    archiveEmail
  } = useEmail();
  
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [showFullHeaders, setShowFullHeaders] = useState(false);
  const [showReplyCompose, setShowReplyCompose] = useState(false);
  const [replyType, setReplyType] = useState('reply');

  useEffect(() => {
    const loadEmail = async () => {
      if (id) {
        setLoading(true);
        try {
          const emailData = await fetchEmail(id);
          setEmail(emailData);
          
          // Mark as read when opened
          if (!emailData.read && emailData.status === 'received') {
            await markAsRead(id);
            setEmail(prev => ({ ...prev, read: true }));
          }
        } catch (error) {
          console.error('Error loading email:', error);
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      }
    };

    loadEmail();
  }, [id, fetchEmail, markAsRead, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gmail-blue"></div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">📧</div>
          <h3 className="text-lg font-medium mb-2">Email not found</h3>
          <p className="text-sm">The email you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-gmail-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Inbox
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      short: date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleStarToggle = async () => {
    if (email.starred) {
      await unstarEmail(email._id);
      setEmail(prev => ({ ...prev, starred: false }));
    } else {
      await starEmail(email._id);
      setEmail(prev => ({ ...prev, starred: true }));
    }
  };

  const handleDelete = async () => {
    const result = await deleteEmail(email._id);
    if (result.success) {
      navigate('/dashboard');
    } else {
      alert(result.error);
    }
  };

  const handleArchive = async () => {
    const result = await archiveEmail(email._id);
    if (result.success) {
      setEmail(prev => ({ ...prev, archived: true }));
    } else {
      alert(result.error);
    }
  };

  const handleMarkAsRead = async () => {
    await markAsRead(email._id);
    setEmail(prev => ({ ...prev, read: true }));
  };

  const handleMarkAsUnread = async () => {
    await markAsUnread(email._id);
    setEmail(prev => ({ ...prev, read: false }));
  };

  const handleReply = (type = 'reply') => {
    setReplyType(type);
    setShowReplyCompose(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    const badges = {
      sent: { color: 'bg-green-100 text-green-800', text: 'Sent', icon: <Mail className="h-3 w-3" /> },
      draft: { color: 'bg-yellow-100 text-yellow-800', text: 'Draft', icon: <Clock className="h-3 w-3" /> },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed', icon: <X className="h-3 w-3" /> },
      received: { color: 'bg-blue-100 text-blue-800', text: 'Received', icon: <Mail className="h-3 w-3" /> }
    };
    
    const badge = badges[status] || badges.received;
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        <span>{badge.text}</span>
      </span>
    );
  };

  const getInitials = (email) => {
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  const formatEmailBody = (html, text) => {
    if (html && html.trim()) {
      // Clean up HTML and make it safe
      return html;
    } else if (text && text.trim()) {
      // Convert plain text to HTML with proper formatting
      return text
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
    }
    return '<p>No content available.</p>';
  };

  const dateInfo = formatDate(email.created_at);

  return (
    <>
      <div className="flex flex-col h-full bg-white">
        {/* Email Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 no-print">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Back to list"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={handleArchive}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Archive"
            >
              <Archive className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-red-600"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            
            <button
              onClick={email.read ? handleMarkAsUnread : handleMarkAsRead}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title={email.read ? "Mark as unread" : "Mark as read"}
            >
              {email.read ? <Mail className="h-5 w-5 text-gray-600" /> : <MailOpen className="h-5 w-5 text-gray-600" />}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(email.status)}
            
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="More actions"
              >
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 action-menu">
                  <button
                    onClick={() => copyToClipboard(email.from_email)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy sender email</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => setShowFullHeaders(!showFullHeaders)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Tag className="h-4 w-4" />
                    <span>{showFullHeaders ? 'Hide' : 'Show'} headers</span>
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Subject */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {email.subject || '(No Subject)'}
              </h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleStarToggle}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Star className={`h-5 w-5 ${email.starred ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
                </button>
                <span className="text-sm text-gray-500">
                  {dateInfo.short}
                </span>
              </div>
            </div>

            {/* Email Meta Info */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200 hover-lift">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 border-2 border-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold text-lg bg-white">
                    {getInitials(email.from_email)}
                  </div>
                  
                  <div className="flex-1 min-w-0 group">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {email.from_email}
                      </h3>
                      <button
                        onClick={() => copyToClipboard(email.from_email)}
                        className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">To:</span>
                        <span>{email.to_email}</span>
                        <button
                          onClick={() => copyToClipboard(email.to_email)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Copy className="h-3 w-3 text-gray-400" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{dateInfo.full}</span>
                      </div>
                      
                      {email.message_id && (
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4" />
                          <span className="font-mono text-xs">{email.message_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={handleStarToggle}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Star className={`h-5 w-5 ${email.starred ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
              
              {/* Full Headers */}
              {showFullHeaders && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Full Headers</h4>
                  <div className="bg-gray-100 rounded p-3 text-xs font-mono text-gray-700 max-h-40 overflow-y-auto">
                    <div>Message-ID: {email.message_id}</div>
                    <div>From: {email.from_email}</div>
                    <div>To: {email.to_email}</div>
                    <div>Subject: {email.subject}</div>
                    <div>Date: {dateInfo.full}</div>
                    <div>Status: {email.status}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Paperclip className="h-5 w-5 mr-2" />
                  Attachments ({email.attachments.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {email.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors hover-lift"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gmail-blue rounded-lg flex items-center justify-center">
                          <Paperclip className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {attachment.filename}
                          </div>
                          <div className="text-sm text-gray-500">
                            {attachment.contentType} • {Math.round(attachment.size / 1024)} KB
                          </div>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <Download className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Body */}
            <div className="email-content bg-white rounded-lg border border-gray-200 p-6 hover-lift">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: formatEmailBody(email.body_html, email.body_text)
                }}
                style={{
                  lineHeight: '1.6',
                  fontSize: '16px',
                  color: '#374151'
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 no-print">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => handleReply('reply')}
                  className="flex items-center space-x-2 px-6 py-3 bg-gmail-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium hover-lift"
                >
                  <Reply className="h-4 w-4" />
                  <span>Reply</span>
                </button>
                <button 
                  onClick={() => handleReply('replyAll')}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium hover-lift"
                >
                  <ReplyAll className="h-4 w-4" />
                  <span>Reply All</span>
                </button>
                <button 
                  onClick={() => handleReply('forward')}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium hover-lift"
                >
                  <Forward className="h-4 w-4" />
                  <span>Forward</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleArchive}
                  className="p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors hover-lift"
                  title="Archive"
                >
                  <Archive className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors hover-lift"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reply Compose Modal */}
      {showReplyCompose && (
        <ReplyCompose
          originalEmail={email}
          replyType={replyType}
          onClose={() => setShowReplyCompose(false)}
        />
      )}
    </>
  );
};

export default EmailView;