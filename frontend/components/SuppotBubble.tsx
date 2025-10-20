import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SupportBubbleProps {
  className?: string;
}

const SupportBubble: React.FC<SupportBubbleProps> = ({ className = '' }) => {
  const { actualTheme } = useTheme();
  const { t } = useLanguage();

  const handleSupportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Support bubble clicked!'); // Debug log
    
    // Open Facebook Messenger chat with NDhubs fanpage
    const messengerUrl = 'https://m.me/ndhubs';
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Floating Support Bubble */}
      <div
        className={`fixed right-4 z-50 ${className || 'bottom-6'}`}
        style={{ zIndex: 9999 }}
      >
        <button
          onClick={handleSupportClick}
          className={`
            w-14 h-14 rounded-full shadow-lg transition-all duration-300 
            hover:scale-110 hover:shadow-xl active:scale-95
            flex items-center justify-center cursor-pointer
            ${actualTheme === 'dark' 
              ? 'bg-blue-600 hover:bg-blue-500 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
          `}
          type="button"
          title={t.support?.title || 'Support'}
          aria-label={t.support?.title || 'Support'}
        >
          {/* Support/Chat Icon SVG */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
          >
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
              fill="currentColor"
            />
            <circle cx="8" cy="10" r="1.5" fill="white"/>
            <circle cx="12" cy="10" r="1.5" fill="white"/>
            <circle cx="16" cy="10" r="1.5" fill="white"/>
          </svg>
        </button>

        {/* Pulse animation ring */}
        <div
          className={`
            absolute inset-0 rounded-full animate-ping pointer-events-none
            ${actualTheme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'}
            opacity-20
          `}
        />
      </div>
    </>
  );
};

export default SupportBubble;