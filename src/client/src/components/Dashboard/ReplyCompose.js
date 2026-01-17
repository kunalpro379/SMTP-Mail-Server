import React, { useState } from 'react';
// Fixed ESLint error: removed unused useRef import
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEmail } from '../../contexts/EmailContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  X, 
  Send, 
  Paperclip, 
  Image, 
  Smile, 
  Minimize2,
  Maximize2,
  Save
} from 'lucide-react';

const ReplyCompose = ({ onClose, originalEmail, replyType = 'reply' }) => {
  const { sendEmail, createDraft } = useEmail();
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Prepare reply data
  const getReplySubject = () => {
    const subject = originalEmail.subject || '';
    if (replyType === 'forward') {
      return subject.startsWith('Fwd:') ? subject : `Fwd: ${subject}`;
    }
    return subject.startsWith('Re:') ? subject : `Re: ${subject}`;
  };

  const getReplyTo = () => {
    if (replyType === 'replyAll') {
      // For reply all, include original sender and other recipients
      return originalEmail.from_email;
    }
    return originalEmail.from_email;
  };

  const getReplyBody = () => {
    const date = new Date(originalEmail.created_at).toLocaleString();
    const originalText = originalEmail.body_text || 'No content';
    
    if (replyType === 'forward') {
      return `
        <br><br>
        ---------- Forwarded message ----------<br>
        From: ${originalEmail.from_email}<br>
        Date: ${date}<br>
        Subject: ${originalEmail.subject}<br>
        To: ${originalEmail.to_email}<br>
        <br>
        ${originalEmail.body_html || originalText.replace(/\n/g, '<br>')}
      `;
    } else {
      return `
        <br><br>
        On ${date}, ${originalEmail.from_email} wrote:<br>
        <blockquote style="margin: 0 0 0 0.8ex; border-left: 1px solid #ccc; padding-left: 1ex;">
          ${originalEmail.body_html || originalText.replace(/\n/g, '<br>')}
        </blockquote>
      `;
    }
  };

  const [formData, setFormData] = useState({
    to: replyType === 'forward' ? '' : getReplyTo(),
    cc: '',
    bcc: '',
    subject: getReplySubject(),
    body: getReplyBody()
  });

  const [showCcBcc, setShowCcBcc] = useState(false);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background', 'align',
    'link', 'image'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSend = async () => {
    if (!formData.to.trim()) {
      alert('Please enter a recipient email address');
      return;
    }

    setSending(true);
    
    const emailData = {
      from: user.email,
      to: formData.to,
      subject: formData.subject,
      html: formData.body,
      text: formData.body.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const result = await sendEmail(emailData);
    
    if (result.success) {
      onClose();
    } else {
      alert(`Failed to send email: ${result.error}`);
    }
    
    setSending(false);
  };

  const handleSaveDraft = async () => {
    const emailData = {
      from: user.email,
      to: formData.to,
      subject: formData.subject,
      html: formData.body,
      text: formData.body.replace(/<[^>]*>/g, '')
    };

    const result = await createDraft(emailData);
    
    if (result.success) {
      alert('Draft saved successfully');
    } else {
      alert(`Failed to save draft: ${result.error}`);
    }
  };

  const getTitle = () => {
    switch (replyType) {
      case 'reply': return 'Reply';
      case 'replyAll': return 'Reply All';
      case 'forward': return 'Forward';
      default: return 'Reply';
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 w-80 bg-white border border-gray-300 rounded-t-lg shadow-lg z-50">
        <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200">
          <span className="font-medium text-gray-900 truncate">
            {getTitle()}: {formData.subject}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Maximize2 className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-100 border-b border-gray-200 rounded-t-lg">
          <h3 className="font-medium text-gray-900">
            {getTitle()}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Minimize2 className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Recipients */}
          <div className="p-4 space-y-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 w-12">To:</label>
              <input
                type="email"
                value={formData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gmail-blue"
                placeholder="Recipients"
              />
              <button
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-sm text-gmail-blue hover:underline"
              >
                Cc/Bcc
              </button>
            </div>

            {showCcBcc && (
              <>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 w-12">Cc:</label>
                  <input
                    type="email"
                    value={formData.cc}
                    onChange={(e) => handleInputChange('cc', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gmail-blue"
                    placeholder="Carbon copy"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 w-12">Bcc:</label>
                  <input
                    type="email"
                    value={formData.bcc}
                    onChange={(e) => handleInputChange('bcc', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gmail-blue"
                    placeholder="Blind carbon copy"
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 w-12">Subject:</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gmail-blue"
                placeholder="Subject"
              />
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col">
            <ReactQuill
              theme="snow"
              value={formData.body}
              onChange={(value) => handleInputChange('body', value)}
              modules={quillModules}
              formats={quillFormats}
              className="flex-1"
              placeholder="Compose your message..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center space-x-2 px-6 py-2 bg-gmail-blue text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>{sending ? 'Sending...' : 'Send'}</span>
              </button>

              <button
                onClick={handleSaveDraft}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Insert image"
              >
                <Image className="h-4 w-4" />
              </button>
              <button
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Insert emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyCompose;