'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, loginWithGoogle, forgotPassword, isLoading } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(initialMode);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: ''
  });

  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: ''
  });

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setMessage(null);
      setLoginData({ email: '', password: '' });
      setRegisterData({ name: '', email: '', password: '', password_confirmation: '', phone: '' });
      setForgotPasswordData({ email: '' });
    }
  }, [isOpen, initialMode]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleForgotPasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!loginData.email.trim() || !loginData.password.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }
    
    try {
      const result = await login(loginData.email.trim(), loginData.password);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Đăng nhập thành công!' });
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Đăng nhập thất bại' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi đăng nhập' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    // Validation
    if (!registerData.name.trim() || !registerData.email.trim() || !registerData.password.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
      return;
    }
    
    if (registerData.password !== registerData.password_confirmation) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    
    if (registerData.password.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }
    
    try {
      const result = await register({
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        password_confirmation: registerData.password_confirmation,
        phone: registerData.phone.trim() || undefined
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Đăng ký thành công!' });
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Đăng ký thất bại' });
      }
    } catch (error) {
      console.error('Register error:', error);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi đăng ký' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    // Validation
    if (!forgotPasswordData.email.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập địa chỉ email' });
      return;
    }
    
    try {
      const result = await forgotPassword(forgotPasswordData.email.trim());
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!' });
        // Không đóng modal để người dùng có thể thấy thông báo thành công
      } else {
        setMessage({ type: 'error', text: result.message || 'Gửi email thất bại' });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi gửi email khôi phục' });
    }
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot-password') => {
    setMode(newMode);
    setMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'login' 
              ? (t.auth?.login || 'Đăng nhập') 
              : mode === 'register' 
                ? (t.auth?.register || 'Đăng ký')
                : 'Quên mật khẩu'
            }
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

          {/* Mode Tabs */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                mode === 'login'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.auth?.login || 'Đăng nhập'}
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                mode === 'register'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.auth?.register || 'Đăng ký'}
            </button>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.auth?.email || 'Email'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginInputChange}
                  required
                  placeholder="example@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.auth?.password || 'Mật khẩu'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginInputChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Quên mật khẩu?
                </button>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isLoading ? 'Đang đăng nhập...' : (t.auth?.login || 'Đăng nhập')}</span>
              </button>
               
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Hoặc</span>
                </div>
              </div>
              
              {/* Google Login Button */}
              <button
                type="button"
                onClick={() => {
                  // Open Google Auth Modal
                  const googleModal = document.createElement('div');
                  googleModal.id = 'google-auth-modal';
                  document.body.appendChild(googleModal);
                  
                  Promise.all([
                     import('./GoogleAuthModal'),
                     import('react-dom/client')
                   ]).then(([{ default: GoogleAuthModal }, { createRoot }]) => {
                     const root = createRoot(googleModal);
                     root.render(
                       React.createElement(GoogleAuthModal, {
                         isOpen: true,
                         onClose: () => {
                           root.unmount();
                           document.body.removeChild(googleModal);
                         },
                         onSuccess: () => {
                           root.unmount();
                           document.body.removeChild(googleModal);
                           onClose();
                         },
                         loginWithGoogle: async (credential) => {
                           try {
                             await loginWithGoogle(credential);
                             return { success: true, message: 'Đăng nhập thành công' };
                           } catch (error) {
                             return { success: false, message: error.message || 'Đăng nhập thất bại' };
                           }
                         }
                       })
                     );
                   });
                }}
                className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Đăng nhập với Google</span>
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.auth?.name || 'Họ và tên'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={registerData.name}
                  onChange={handleRegisterInputChange}
                  required
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.auth?.email || 'Email'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterInputChange}
                  required
                  placeholder="example@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.auth?.phone || 'Số điện thoại'}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={registerData.phone}
                  onChange={handleRegisterInputChange}
                  placeholder="+84 xxx xxx xxx"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.auth?.password || 'Mật khẩu'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterInputChange}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.auth?.passwordHint || 'Mật khẩu phải có ít nhất 6 ký tự'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.auth?.confirmPassword || 'Xác nhận mật khẩu'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={registerData.password_confirmation}
                  onChange={handleRegisterInputChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isLoading ? 'Đang đăng ký...' : (t.auth?.register || 'Đăng ký')}</span>
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={forgotPasswordData.email}
                  onChange={handleForgotPasswordInputChange}
                  required
                  placeholder="example@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}</span>
              </button>

              {/* Back to login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  ← Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {mode === 'login' ? (
              <>
                {t.auth?.noAccount || 'Chưa có tài khoản?'}{' '}
                <button
                  onClick={() => switchMode('register')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  {t.auth?.register || 'Đăng ký ngay'}
                </button>
              </>
            ) : mode === 'register' ? (
              <>
                {t.auth?.hasAccount || 'Đã có tài khoản?'}{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  {t.auth?.login || 'Đăng nhập ngay'}
                </button>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;