import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenIcon, ImageIcon, SparklesIcon, SpeakerIcon, DocumentIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, currentPage }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated, totalCredits } = useAuth();

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
      <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] backdrop-blur-sm border-r shadow-xl transition-all duration-300 z-[10] xl:translate-x-0 xl:w-80 ${
        theme === 'dark' 
          ? 'bg-gray-900/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      } ${
        isOpen ? 'w-80 sm:w-96 translate-x-0' : 'w-0 -translate-x-full'
      }`}>
        <div className="flex flex-col h-full overflow-hidden"> 
          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-2">
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

          {/* User Plan Section - Always show for testing */}
          <div className={`p-3 sm:p-4 border-t flex-shrink-0 ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="space-y-3">
              {/* Current Plan */}
              <div className={`p-3 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Current Plan
                  </span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user?.pricing_plan?.is_premium
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                  }`}>
                    {user?.pricing_plan?.name || 'Free'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {Math.floor(totalCredits || 0)} Credits
                    </div>
                    <div className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Available
                    </div>
                  </div>
                </div>  
              </div>
              {/* Change Plan Button */}
              <div className="w-full">
                <Link
                  to="/app/price"
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Upgrade Plan
                </Link>
              </div>
            </div>
          </div>
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