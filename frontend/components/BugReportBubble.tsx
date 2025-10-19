import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import BugReportModal from './BugReportModal';

interface BugReportBubbleProps {
  className?: string;
}

const BugReportBubble: React.FC<BugReportBubbleProps> = ({ className = '' }) => {
  const { actualTheme } = useTheme();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBubbleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Bug report bubble clicked!'); // Debug log
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Floating Bug Report Bubble */}
      <div
        className={`fixed right-4 z-50 ${className || 'bottom-6'}`}
        style={{ zIndex: 9999 }}
      >
        <button
          onClick={handleBubbleClick}
          className={`
            w-14 h-14 rounded-full shadow-lg transition-all duration-300 
            hover:scale-110 hover:shadow-xl active:scale-95
            flex items-center justify-center cursor-pointer
            ${actualTheme === 'dark' 
              ? 'bg-red-600 hover:bg-red-500 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white'
            }
          `}
          type="button"
          title={t.bugReport?.reportBug || 'Report Bug'}
          aria-label={t.bugReport?.reportBug || 'Report Bug'}
        >
          {/* Bug Icon SVG */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
          >
            <path
              d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.42.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8z"
              fill="currentColor"
            />
            <circle cx="15.5" cy="13.5" r="1.5" fill="currentColor"/>
            <circle cx="8.5" cy="13.5" r="1.5" fill="currentColor"/>
          </svg>
        </button>

        {/* Pulse animation ring */}
        <div
          className={`
            absolute inset-0 rounded-full animate-ping pointer-events-none
            ${actualTheme === 'dark' ? 'bg-red-600' : 'bg-red-500'}
            opacity-20
          `}
        />
      </div>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default BugReportBubble;