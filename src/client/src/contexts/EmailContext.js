import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mailAPI } from '../services/api';
import { useAuth } from './AuthContext';

const EmailContext = createContext();

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};

export const EmailProvider = ({ children }) => {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await mailAPI.getMails();
      setEmails(response.data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch single email
  const fetchEmail = useCallback(async (id) => {
    try {
      const response = await mailAPI.getMail(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching email:', error);
      throw error;
    }
  }, []);

  // Send email
  const sendEmail = async (emailData) => {
    try {
      // Normalize email addresses to lowercase
      const normalizedFrom = (emailData.from || '').toLowerCase().trim();
      const normalizedTo = (emailData.to || '').toLowerCase().trim();
      
      if (!normalizedFrom || !normalizedTo) {
        return { 
          success: false, 
          error: 'Both sender and recipient email addresses are required' 
        };
      }
      
      // First create the mail
      const createResponse = await mailAPI.createMail({
        from_email: normalizedFrom,
        to_email: normalizedTo,
        subject: emailData.subject || '(No Subject)',
        body_text: emailData.text || '',
        body_html: emailData.html || ''
      });

      // Then send it
      const sendResponse = await mailAPI.sendMail(createResponse.data._id, {
        from_email: normalizedFrom,
        to_email: normalizedTo
      });

      // Refresh emails after sending
      setRefreshTrigger(prev => prev + 1);
      
      return { success: true, data: sendResponse.data };
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to send email';
      console.error('Detailed error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Create draft
  const createDraft = async (emailData) => {
    try {
      const response = await mailAPI.createMail({
        from_email: emailData.from,
        to_email: emailData.to,
        subject: emailData.subject,
        body_text: emailData.text,
        body_html: emailData.html
      });
      
      setRefreshTrigger(prev => prev + 1);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating draft:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to create draft' 
      };
    }
  };

  // Delete email (client-side only for now)
  const deleteEmail = useCallback(async (id) => {
    try {
      // TODO: Implement backend endpoint
      // await mailAPI.deleteMail(id);
      
      // For now, just remove from local state
      setEmails(prev => prev.filter(email => email._id !== id));
      if (selectedEmail?._id === id) {
        setSelectedEmail(null);
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting email:', error);
      return { 
        success: false, 
        error: 'Delete functionality not implemented in backend yet'
      };
    }
  }, [selectedEmail]);

  // Mark as read/unread (client-side only for now)
  const markAsRead = useCallback(async (id) => {
    try {
      // TODO: Implement backend endpoint
      // await mailAPI.markAsRead(id);
      
      // For now, just update local state
      setEmails(prev => prev.map(email => 
        email._id === id ? { ...email, read: true } : email
      ));
      return { success: true };
    } catch (error) {
      console.error('Error marking as read:', error);
      return { success: false, error: 'Mark as read functionality not implemented in backend yet' };
    }
  }, []);

  const markAsUnread = useCallback(async (id) => {
    try {
      // TODO: Implement backend endpoint
      // await mailAPI.markAsUnread(id);
      
      // For now, just update local state
      setEmails(prev => prev.map(email => 
        email._id === id ? { ...email, read: false } : email
      ));
      return { success: true };
    } catch (error) {
      console.error('Error marking as unread:', error);
      return { success: false, error: 'Mark as unread functionality not implemented in backend yet' };
    }
  }, []);

  // Star/unstar email (client-side only for now)
  const starEmail = async (id) => {
    try {
      // TODO: Implement backend endpoint
      // await mailAPI.starMail(id);
      
      // For now, just update local state
      setEmails(prev => prev.map(email => 
        email._id === id ? { ...email, starred: true } : email
      ));
      return { success: true };
    } catch (error) {
      console.error('Error starring email:', error);
      return { success: false, error: 'Star functionality not implemented in backend yet' };
    }
  };

  const unstarEmail = async (id) => {
    try {
      // TODO: Implement backend endpoint
      // await mailAPI.unstarMail(id);
      
      // For now, just update local state
      setEmails(prev => prev.map(email => 
        email._id === id ? { ...email, starred: false } : email
      ));
      return { success: true };
    } catch (error) {
      console.error('Error unstarring email:', error);
      return { success: false, error: 'Unstar functionality not implemented in backend yet' };
    }
  };

  // Archive email (client-side only for now)
  const archiveEmail = async (id) => {
    try {
      // TODO: Implement backend endpoint
      // await mailAPI.archiveMail(id);
      
      // For now, just update local state
      setEmails(prev => prev.map(email => 
        email._id === id ? { ...email, archived: true } : email
      ));
      return { success: true };
    } catch (error) {
      console.error('Error archiving email:', error);
      return { success: false, error: 'Archive functionality not implemented in backend yet' };
    }
  };

  // Filter emails by type
  const getEmailsByType = (type) => {
    switch (type) {
      case 'inbox':
        return emails.filter(email => email.status === 'received');
      case 'sent':
        return emails.filter(email => email.status === 'sent');
      case 'drafts':
        return emails.filter(email => email.status === 'draft');
      case 'failed':
        return emails.filter(email => email.status === 'failed');
      default:
        return emails;
    }
  };

  // Auto-refresh emails every 10 seconds for real-time updates
  useEffect(() => {
    if (user) {
      fetchEmails();
      const interval = setInterval(fetchEmails, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [user, refreshTrigger, fetchEmails]);

  const value = {
    emails,
    selectedEmail,
    setSelectedEmail,
    loading,
    error,
    fetchEmails,
    fetchEmail,
    sendEmail,
    createDraft,
    deleteEmail,
    markAsRead,
    markAsUnread,
    starEmail,
    unstarEmail,
    archiveEmail,
    getEmailsByType,
    refreshEmails: () => setRefreshTrigger(prev => prev + 1)
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
};