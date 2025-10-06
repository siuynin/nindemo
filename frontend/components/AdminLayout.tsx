import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import BubbleChatbot from './BubbleChatbot';

// Custom CSS for smooth animations
const backgroundAnimationStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-20px) rotate(120deg); }
    66% { transform: translateY(10px) rotate(240deg); }
  }
  
  @keyframes floatReverse {
    0%, 100% { transform: translateX(0px) rotate(0deg); }
    50% { transform: translateX(-15px) rotate(180deg); }
  }
  
  .float-animation {
    animation: float 8s ease-in-out infinite;
  }
  
  .float-reverse-animation {
    animation: floatReverse 10s ease-in-out infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = backgroundAnimationStyles;
  if (!document.head.querySelector('style[data-admin-bg]')) {
    styleElement.setAttribute('data-admin-bg', 'true');
    document.head.appendChild(styleElement);
  }
}

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
  
  // Check if current page is CreativeEditor
  const isCreativeEditorPage = location.pathname.includes('/creative-editor');
  
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
      console.log('Window width:', window.innerWidth, 'Is mobile:', mobile);
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
    console.log('toggleSidebar called, window width:', window.innerWidth);
    if (window.innerWidth >= 768) {
      setIsExpanded(prev => !prev);
      console.log('Toggling expanded state');
    } else {
      setIsMobileOpen(prev => !prev);
      console.log('Toggling mobile open state');
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background Circles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Circle 1 - Top Right */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/15 to-pink-400/10 float-animation"></div>
        
        {/* Circle 2 - Bottom Left */}
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-green-400/15 via-blue-400/10 to-purple-400/20 float-reverse-animation"></div>
      </div>

      {/* Sidebar - Ẩn cho CreativeEditor */}
      {!isCreativeEditorPage && (
        <>
          <AdminSidebar
            isExpanded={isMobileOpen || (!isMobile && isExpanded)}
            isMobileOpen={isMobileOpen}
            isHovered={isHovered}
            onSetIsHovered={setIsHovered}
            onMobileClose={() => setIsMobileOpen(false)}
            currentPage={currentPage}
          />
          
          {/* Mobile Backdrop */}
          {isMobileOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
          )}
        </>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out relative z-10 ${
          isCreativeEditorPage 
            ? "ml-0" // Không có margin cho CreativeEditor
            : isExpanded || isHovered 
              ? "lg:ml-[290px]" 
              : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        {/* Header - Ẩn cho CreativeEditor */}
        {!isCreativeEditorPage && (
          <AdminTopBar
            onToggleSidebar={toggleSidebar}
            isSidebarOpen={isMobile ? isMobileOpen : isExpanded}
          />
        )}

        {/* Page Content */}
        <div className={`flex-1 ${isCreativeEditorPage ? 'h-screen' : ''}`}>
          <Outlet />
        </div>

        {/* Chatbot - Ẩn cho CreativeEditor */}
        {!isCreativeEditorPage && <BubbleChatbot />}
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