import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
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

const AdminLayoutContent: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  
  // Sidebar state management
  const [isExpanded, setIsExpanded] = useState<boolean>(() => loadState('sidebarExpanded', true));
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

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
    if (pathname.includes('/document')) {
      return 'document';
    }
    if (pathname.includes('/pricing')) {
      return 'pricing';
    }
    return 'home';
  };

  const currentPage = getPageFromPath(location.pathname);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    saveState('sidebarExpanded', isExpanded);
  }, [isExpanded]);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsExpanded(prev => !prev);
    } else {
      setIsMobileOpen(prev => !prev);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div>
        <AdminSidebar
          isExpanded={isMobile ? false : isExpanded}
          isMobileOpen={isMobileOpen}
          isHovered={isHovered}
          onSetIsHovered={setIsHovered}
          currentPage={currentPage}
        />
        
        {/* Mobile Backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        {/* Header */}
        <AdminTopBar
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isMobile ? isMobileOpen : isExpanded}
        />

        {/* Page Content */}
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Chatbot */}
        <BubbleChatbot />
      </div>
    </div>
  );
};

const AdminLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AdminLayoutContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default AdminLayout;