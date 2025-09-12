import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import ProfileModal from './ProfileModal';
import AuthModal from './AuthModal';

interface TopBarProps {
  className?: string;
}

const TopBar: React.FC<TopBarProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsAccountDropdownOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLoginClick = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleRegisterClick = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsAccountDropdownOpen(false);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 w-full h-16 backdrop-blur-sm border-b shadow-sm flex items-center justify-between px-4 z-50 ${
        theme === 'dark' 
          ? 'bg-gray-900/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      } ${className}`}>
      {/* Left side - Logo/Brand */}
      <div className="flex items-center">
        <div className="text-xl font-bold text-gray-800 dark:text-white">
          AI Studio
        </div>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center space-x-4">
        {/* Language Toggle */}
        <LanguageToggle />
        
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Account Dropdown */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={toggleAccountDropdown}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              disabled={isLoading}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {getUserInitials(user.name)}
                </div>
              )}
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {user.role === 'admin' ? (t.topbar?.admin || 'Admin') : (t.topbar?.userRole || 'User')}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  isAccountDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                  {user.phone && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {user.phone}
                    </p>
                  )}
                </div>
                
                {/* Menu Items */}
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{t.topbar?.profile || 'Thông tin cá nhân'}</span>
                </button>
                
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{t.topbar?.settings || 'Cài đặt'}</span>
                </a>
                
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{isLoading ? (t.topbar?.loggingOut || 'Đang đăng xuất...') : (t.topbar?.logout || 'Đăng xuất')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Login Button for unauthenticated users */
           <div className="flex items-center space-x-2">
             <button
               onClick={handleLoginClick}
               className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
             >
               {t.topbar?.login || 'Đăng nhập'}
             </button>
             <button
               onClick={handleRegisterClick}
               className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
             >
               {t.topbar?.register || 'Đăng ký'}
             </button>
           </div>
        )}
      </div>
    </div>
    
    {/* Profile Modal */}
     <ProfileModal 
       isOpen={isProfileModalOpen} 
       onClose={() => setIsProfileModalOpen(false)} 
     />
     
     {/* Auth Modal */}
     <AuthModal 
       isOpen={isAuthModalOpen} 
       onClose={() => setIsAuthModalOpen(false)}
       initialMode={authModalMode}
     />
    </>
  );
};

export default TopBar;