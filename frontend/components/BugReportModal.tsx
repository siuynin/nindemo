import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BugReportData {
  title: string;
  description: string;
  screenshots?: File[];
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const { actualTheme } = useTheme();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<BugReportData>({
    title: '',
    description: '',
    screenshots: []
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      setFormData({
        title: '',
        description: '',
        screenshots: []
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
  }, [isOpen]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setMessage({ 
        type: 'error', 
        text: t.bugReport?.invalidFiles || 'Some files were rejected. Only images under 5MB are allowed.' 
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setFormData(prev => ({
      ...prev,
      screenshots: [...(prev.screenshots || []), ...validFiles]
    }));

    // Create preview URLs
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => [...prev, url]);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots?.filter((_, i) => i !== index) || []
    }));
    
    // Clean up preview URL
    const urlToRevoke = previewUrls[index];
    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke);
    }
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setMessage({ type: 'error', text: t.bugReport?.loginRequired || 'Please login first to report bugs' });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: t.bugReport?.allFieldsRequired || 'Title and description are required' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      
      // Add screenshots if any
      if (formData.screenshots && formData.screenshots.length > 0) {
        formData.screenshots.forEach((file, index) => {
          submitData.append(`screenshots[${index}]`, file);
        });
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/bug-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: t.bugReport?.submitSuccess || 'Bug report submitted successfully!' });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || t.bugReport?.submitError || 'Error submitting bug report' 
        });
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      setMessage({ 
        type: 'error', 
        text: t.bugReport?.networkError || 'Network error. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl
        ${actualTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 border-b
          ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {t.bugReport?.title || 'Report Bug'}
          </h2>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-full transition-colors
              ${actualTheme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message */}
          {message && (
            <div className={`
              mb-4 p-3 rounded-md text-sm
              ${message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
              }
            `}>
              {message.text}
            </div>
          )}

          {/* Login prompt for unauthenticated users */}
          {!isAuthenticated && (
            <div className={`
              mb-4 p-4 rounded-md border
              ${actualTheme === 'dark' 
                ? 'bg-yellow-900 text-yellow-200 border-yellow-700' 
                : 'bg-yellow-50 text-yellow-800 border-yellow-200'
              }
            `}>
              <p className="text-sm">
                {t.bugReport?.loginRequired || 'Please login to report bugs. This helps us track and respond to your reports.'}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.bugReport?.bugTitle || 'Title'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`
                  w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500
                  ${actualTheme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }
                `}
                placeholder={t.bugReport?.bugTitlePlaceholder || 'Enter a brief title for the bug'}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.bugReport?.description || 'Description'} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className={`
                  w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500
                  ${actualTheme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }
                `}
                placeholder={t.bugReport?.descriptionPlaceholder || 'Describe the bug in detail'}
                required
              />
            </div>

            {/* Screenshots */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.bugReport?.screenshots || 'Screenshots'} <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              
              {/* File Input */}
              <div className="mb-3">
                <input
                  type="file"
                  id="screenshots"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="screenshots"
                  className={`
                    inline-flex items-center px-4 py-2 border border-dashed rounded-md cursor-pointer transition-colors
                    ${actualTheme === 'dark' 
                      ? 'border-gray-600 hover:border-gray-500 bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }
                  `}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t.bugReport?.addScreenshots || 'Add Screenshots'}
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {t.bugReport?.screenshotHint || 'PNG, JPG, GIF up to 5MB each'}
                </p>
              </div>

              {/* Preview Images */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-md truncate">
                        {selectedFiles[index]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={`
          px-6 py-4 border-t flex justify-end gap-3
          ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <button
            type="button"
            onClick={onClose}
            className={`
              px-4 py-2 rounded-md transition-colors
              ${actualTheme === 'dark' 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }
            `}
          >
            {t.bugReport?.cancel || 'Cancel'}
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !isAuthenticated}
            className={`
              px-4 py-2 rounded-md transition-colors flex items-center gap-2
              ${isLoading || !isAuthenticated
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
              }
            `}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading 
              ? t.bugReport?.submitting || 'Submitting...'
              : t.bugReport?.submitBugReport || 'Submit Bug Report'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default BugReportModal;