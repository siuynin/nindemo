import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';
import AuthModal from './AuthModal';

interface UserMenuProps {
  className?: string;
  store?: any;
  project?: any;
}

const UserMenu: React.FC<UserMenuProps> = ({ className = '', store, project }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen);
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsAccountDropdownOpen(false);
  };

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleRegisterClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    setIsAccountDropdownOpen(false);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={toggleAccountDropdown}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name || user?.email}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isAccountDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t.topbar?.profile || 'Profile'}
                  </button>
                  <button
                    onClick={() => window.location.href = '/user-credit'}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    User Credit
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t.topbar?.logout || 'Logout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoginClick}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {t.topbar?.login || 'Login'}
            </button>
            <button
              onClick={handleRegisterClick}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.topbar?.register || 'Register'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </>
  );
};

export default UserMenu;