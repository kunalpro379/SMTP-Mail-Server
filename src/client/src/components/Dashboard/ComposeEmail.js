import React, { useState, useRef } from 'react';
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
  Save,
  CheckCircle
} from 'lucide-react';

const ComposeEmail = ({ onClose, replyTo = null }) => {
  const { sendEmail, createDraft } = useEmail();
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    to: replyTo?.from_email || '',
    cc: '',
    bcc: '',
    subject: replyTo?.subject ? `Re: ${replyTo.subject}` : '',
    body: ''
  });
  const [showCcBcc, setShowCcBcc] = useState(false);
  const fileInputRef = useRef(null);

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
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
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
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

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    // Handle file attachments here
    console.log('Selected files:', files);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-2 sm:right-4 w-80 sm:w-96 bg-white border-2 border-gray-300 rounded-t-xl shadow-2xl z-50">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-semibold text-gray-900 truncate text-sm">
              {formData.subject || 'New Message'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Expand"
            >
              <Maximize2 className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Close"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${
      isFullscreen 
        ? 'inset-0' 
        : 'inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:left-auto sm:w-[500px] h-[95vh] sm:h-[600px]'
    } bg-white border-2 border-gray-300 rounded-t-2xl sm:rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden`}>
      
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-gray-200">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg">
            {replyTo ? 'Reply' : 'New Message'}
          </h3>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 sm:p-2 hover:bg-white/50 rounded-lg transition-colors sm:block hidden"
            title="Minimize"
          >
            <Minimize2 className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 sm:p-2 hover:bg-white/50 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-white/50 rounded-lg transition-colors"
            title="Close"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Email sent successfully!</span>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Recipients Section */}
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold text-gray-700">To:</label>
              <button
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 py-0.5 rounded"
              >
                Cc/Bcc
              </button>
            </div>
            <input
              type="email"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors"
              placeholder="Enter recipient email"
            />
          </div>

          {showCcBcc && (
            <>
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-700">Cc:</label>
                <input
                  type="email"
                  value={formData.cc}
                  onChange={(e) => handleInputChange('cc', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors"
                  placeholder="Carbon copy"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-700">Bcc:</label>
                <input
                  type="email"
                  value={formData.bcc}
                  onChange={(e) => handleInputChange('bcc', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors"
                  placeholder="Blind carbon copy"
                />
              </div>
            </>
          )}

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-gray-700">Subject:</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors"
              placeholder="Enter subject"
            />
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col bg-white quill-mobile-compact">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 640px) {
              .quill-mobile-compact .ql-toolbar {
                padding: 4px 6px !important;
                border: none !important;
                background: #f9fafb !important;
              }
              .quill-mobile-compact .ql-toolbar button {
                width: 24px !important;
                height: 24px !important;
                padding: 2px !important;
                margin: 0 1px !important;
              }
              .quill-mobile-compact .ql-toolbar button svg {
                width: 14px !important;
                height: 14px !important;
              }
              .quill-mobile-compact .ql-toolbar .ql-stroke {
                stroke-width: 2 !important;
              }
              .quill-mobile-compact .ql-container {
                font-size: 14px !important;
              }
              .quill-mobile-compact .ql-editor {
                padding: 8px 10px !important;
                min-height: 120px !important;
              }
              .quill-mobile-compact .ql-editor.ql-blank::before {
                font-size: 13px !important;
                font-style: italic !important;
                left: 10px !important;
              }
            }
          `}} />
          <ReactQuill
            theme="snow"
            value={formData.body}
            onChange={(value) => handleInputChange('body', value)}
            modules={quillModules}
            formats={quillFormats}
            className="flex-1 border-none"
            placeholder="Compose your message..."
            style={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          />
        </div>

        {/* Enhanced Footer */}
        <div className="flex flex-col items-stretch p-3 sm:p-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between space-x-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{sending ? 'Sending...' : 'Send'}</span>
            </button>

            <button
              onClick={handleSaveDraft}
              className="flex-1 flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium"
            >
              <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Save Draft</span>
              <span className="xs:hidden">Draft</span>
            </button>
          </div>

          <div className="flex items-center justify-center space-x-2 sm:space-x-3">
            <button
              onClick={handleAttachment}
              className="p-2.5 sm:p-3 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors flex items-center justify-center border-2 border-transparent hover:border-gray-300"
              title="Attach files"
            >
              <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              className="p-2.5 sm:p-3 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors flex items-center justify-center border-2 border-transparent hover:border-gray-300"
              title="Insert image"
            >
              <Image className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              className="p-2.5 sm:p-3 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors flex items-center justify-center border-2 border-transparent hover:border-gray-300"
              title="Insert emoji"
            >
              <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ComposeEmail;