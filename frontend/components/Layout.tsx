import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BubbleChatbot from './BubbleChatbot';

// Helper function to load state from localStorage
const loadState = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper function to save state to localStorage
const saveState = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage errors
  }
};

const LayoutContent: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => loadState('isSidebarOpen', true));

  // Map URL paths to page identifiers
  const getPageFromPath = (pathname: string): string => {
    if (pathname.includes('/image-canvas')) {
      return 'canvas';
    }
    if (pathname.includes('/write-assistant')) {
      return 'write';
    }
    if (pathname.includes('/image-creator')) {
      return 'image-creator';
    }
    if (pathname.includes('/text-to-speech')) {
      return 'text-to-speech';
    }
    if (pathname.includes('/voice-clone')) {
      return 'voice-clone';
    }
    if (pathname.includes('/document')) {
      return 'document';
    }
    return 'canvas';
  };

  const currentPage = getPageFromPath(location.pathname);

  // Update document title based on current page
  useEffect(() => {
    const getPageTitle = (page: string): string => {
      const baseTitle = 'AI Studio';
      switch (page) {
        case 'write':
          return `${t.sidebar.writeAssistant.title} - ${baseTitle}`;
        case 'image-creator':
          return `${t.sidebar.imageCreator.title} - ${baseTitle}`;
        case 'canvas':
          return `${t.sidebar.imageCanvas.title} - ${baseTitle}`;
        case 'text-to-speech':
          return `${t.sidebar.textToSpeech.title} - ${baseTitle}`;
        default:
          return baseTitle;
      }
    };

    document.title = getPageTitle(currentPage);
  }, [currentPage, t]);

  const handleSidebarToggle = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    saveState('isSidebarOpen', newState);
  };

  return (
    <div className="w-screen h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans relative flex flex-col transition-colors duration-200">
      {/* Top Bar - Fixed */}
      <TopBar />
      {/* Main Content Area */}
      <div className="flex flex-1 pt-16">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={handleSidebarToggle}
          currentPage={currentPage}
        /> 
        <div className="flex-1 overflow-y-auto xl:ml-80">
          <Outlet />
        </div>
      </div>
      {/* Bubble Chatbot - Fixed position, independent of other components */}
      <BubbleChatbot />
    </div>
  );
};

const Layout: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <LayoutContent />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default Layout;