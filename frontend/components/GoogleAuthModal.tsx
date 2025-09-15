'use client';

import React, { useState, useEffect } from 'react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; message: string }>;
}

// Declare Google Identity Services types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, onSuccess, loginWithGoogle }) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Initialize Google OAuth when modal opens
  useEffect(() => {
    if (isOpen && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with actual client ID
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        setIsGoogleLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Google OAuth:', error);
        setMessage({ type: 'error', text: 'Không thể khởi tạo Google OAuth' });
      }
    }
  }, [isOpen]);

  // Handle Google OAuth response
  const handleGoogleResponse = async (response: any) => {
    try {
      if (response.credential) {
        setIsLoading(true);
        // Call the loginWithGoogle method passed as prop
        const result = await loginWithGoogle(response.credential);
        
        if (result.success) {
          setMessage({ type: 'success', text: 'Đăng nhập Google thành công!' });
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          setMessage({ type: 'error', text: result.message || 'Đăng nhập Google thất bại.' });
        }
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render Google Sign-In button
  const renderGoogleButton = () => {
    const buttonElement = document.getElementById('google-signin-button');
    if (buttonElement && window.google && isGoogleLoaded) {
      window.google.accounts.id.renderButton(buttonElement, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
    }
  };

  // Render button when Google is loaded
  useEffect(() => {
    if (isGoogleLoaded) {
      setTimeout(renderGoogleButton, 100);
    }
  }, [isGoogleLoaded]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Đăng nhập với Google
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Google Sign-In Section */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Đăng nhập nhanh chóng và an toàn với tài khoản Google của bạn
              </p>
            </div>

            {/* Google Sign-In Button Container */}
            <div className="flex justify-center">
              {isGoogleLoaded ? (
                <div id="google-signin-button" className="w-full"></div>
              ) : (
                <div className="w-full">
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-medium rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang tải...</span>
                  </button>
                </div>
              )}
            </div>

            {/* Manual Google Button (Fallback) */}
            {!isGoogleLoaded && (
              <button
                onClick={() => {
                  if (window.google) {
                    window.google.accounts.id.prompt();
                  }
                }}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{isLoading ? 'Đang đăng nhập...' : 'Tiếp tục với Google'}</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
              hoặc
            </span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Alternative Login Link */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
            >
              Sử dụng email để đăng nhập
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Bằng cách đăng nhập với Google, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthModal;