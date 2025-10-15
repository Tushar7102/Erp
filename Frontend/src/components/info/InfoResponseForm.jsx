import React, { useState } from 'react';
import { useInfoProfile } from '../../context/InfoProfileContext';
import { Send, Paperclip, X, MessageSquare } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const InfoResponseForm = ({ infoId }) => {
  const { addInfoResponse } = useInfoProfile();
  const { isDark } = useTheme();
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [medium, setMedium] = useState('internal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && files.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would upload files to a server here
      const fileNames = files.map(file => file.name);
      
      // Add response to context
      await addInfoResponse(infoId, {
        message,
        medium,
        attachments: fileNames,
        timestamp: new Date().toISOString()
      });
      
      // Reset form
      setMessage('');
      setFiles([]);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting response:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-t-lg">
        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          Add Response
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-5">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Communication Medium
          </label>
          <div className="flex flex-wrap gap-4 bg-gray-50 dark:bg-gray-750 p-3 rounded-md">
            <label className="inline-flex items-center hover:bg-white dark:hover:bg-gray-700 p-2 rounded-md transition-colors cursor-pointer">
              <input
                type="radio"
                className="form-radio text-primary-600 h-4 w-4"
                name="medium"
                value="internal"
                checked={medium === 'internal'}
                onChange={() => setMedium('internal')}
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Internal Note</span>
            </label>
            
            <label className="inline-flex items-center hover:bg-white dark:hover:bg-gray-700 p-2 rounded-md transition-colors cursor-pointer">
              <input
                type="radio"
                className="form-radio text-primary-600 h-4 w-4"
                name="medium"
                value="email"
                checked={medium === 'email'}
                onChange={() => setMedium('email')}
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
            </label>
            
            <label className="inline-flex items-center hover:bg-white dark:hover:bg-gray-700 p-2 rounded-md transition-colors cursor-pointer">
              <input
                type="radio"
                className="form-radio text-primary-600 h-4 w-4"
                name="medium"
                value="whatsapp"
                checked={medium === 'whatsapp'}
                onChange={() => setMedium('whatsapp')}
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp</span>
            </label>
          </div>
        </div>
        
        <div className="mb-5">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message
          </label>
          <textarea
            id="message"
            rows="4"
            className="w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 shadow-sm"
            placeholder="Write your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>
        
        {/* File attachments */}
        {files.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attachments
            </label>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-750 p-3 rounded-md">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center">
                    <Paperclip className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-colors">
              <Paperclip className="h-4 w-4 mr-2 text-primary-500" />
              Add File
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              multiple
              onChange={handleFileChange}
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || (!message.trim() && files.length === 0)}
            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InfoResponseForm;