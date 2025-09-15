import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenIcon, ImageIcon, SparklesIcon, SpeakerIcon, DocumentIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, currentPage }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <>
      {/* Toggle Button - Only show on screens smaller than 1200px */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-[60] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg hover:bg-white transition-all duration-200 hover:shadow-xl xl:hidden"
        title={isOpen ? 'Close Sidebar' : 'Open Sidebar'}
      >
        {isOpen ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
      </button>

      {/* Sidebar - Always visible on xl screens (1200px+), toggleable on smaller screens */}
      <div className={`fixed top-16 left-0 h-full backdrop-blur-sm border-r shadow-xl transition-all duration-300 z-[10] xl:translate-x-0 xl:w-80 ${
        theme === 'dark' 
          ? 'bg-gray-900/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      } ${
        isOpen ? 'w-80 sm:w-96 translate-x-0' : 'w-0 -translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`p-3 sm:p-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                   <span className="text-white font-bold text-sm">AI</span>
                 </div>
                 <h2 className={`text-base sm:text-lg font-semibold ${
                   theme === 'dark' ? 'text-white' : 'text-gray-800'
                 }`}>AI Studio</h2>
               </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onToggle}
                    className={`p-1.5 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-2">
            <div className="space-y-1">
              

              <Link
                to="/write-assistant"
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 text-left rounded-lg transition-colors ${
                  currentPage === 'write'
                    ? theme === 'dark'
                      ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-400'
                      : 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <PenIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">{t.sidebar.writeAssistant.title}</div>
                   <div className={`text-xs sm:text-sm truncate ${
                     theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                   }`}>{t.sidebar.writeAssistant.description}</div>
                </div>
              </Link>

              <Link
                to="/image-creator"
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 text-left rounded-lg transition-colors ${
                  currentPage === 'image-creator'
                    ? theme === 'dark'
                      ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-400'
                      : 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">{t.sidebar.imageCreator.title}</div>
                   <div className={`text-xs sm:text-sm truncate ${
                     theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                   }`}>{t.sidebar.imageCreator.description}</div>
                </div>
              </Link>
              <Link
                to="/image-canvas"
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 text-left rounded-lg transition-colors ${
                  currentPage === 'canvas'
                    ? theme === 'dark'
                      ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-400'
                      : 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">{t.sidebar.imageCanvas.title}</div>
                   <div className={`text-xs sm:text-sm truncate ${
                     theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                   }`}>{t.sidebar.imageCanvas.description}</div>
                </div>
              </Link>

              <Link
                to="/text-to-speech"
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 text-left rounded-lg transition-colors ${
                  currentPage === 'text-to-speech'
                    ? theme === 'dark'
                      ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-400'
                      : 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <SpeakerIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">{t.sidebar.textToSpeech.title}</div>
                   <div className={`text-xs sm:text-sm truncate ${
                     theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                   }`}>{t.sidebar.textToSpeech.description}</div>
                </div>
              </Link>

              <Link
                to="/app/elevenlabs"
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 text-left rounded-lg transition-colors ${
                  currentPage === 'elevenlabs'
                    ? theme === 'dark'
                      ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-400'
                      : 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <SpeakerIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">ElevenLabs TTS</div>
                   <div className={`text-xs sm:text-sm truncate ${
                     theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                   }`}>High-quality AI voice generation</div>
                </div>
              </Link>

              <Link
                to="/app/document"
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 text-left rounded-lg transition-colors ${
                  currentPage === 'document'
                    ? theme === 'dark'
                      ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-400'
                      : 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <DocumentIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">Documents</div>
                   <div className={`text-xs sm:text-sm truncate ${
                     theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                   }`}>Quản lý documents & templates</div>
                </div>
              </Link>

            </div>
          </nav>
        </div>
      </div>
      {/* Overlay - Only show on smaller screens when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[40] xl:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default Sidebar;