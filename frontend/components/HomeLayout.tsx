import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import TopBar from './TopBar';

const HomeLayout: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <div className="w-screen h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden font-sans relative flex flex-col transition-colors duration-200">
            {/* Top Bar */}
            <TopBar /> 
            {/* Main Content Area - Full width without sidebar */}
            <div className="flex-1 overflow-auto">
              <Outlet />
            </div>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default HomeLayout;