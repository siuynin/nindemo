import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    console.log('PWA Install Check:', {
      isStandalone,
      isInWebAppiOS,
      userAgent: navigator.userAgent,
      displayMode: window.matchMedia('(display-mode: standalone)').matches
    });
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired', e);
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user dismissed recently
      const dismissedTime = localStorage.getItem('installPromptDismissed');
      if (dismissedTime) {
        const timeDiff = Date.now() - parseInt(dismissedTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (timeDiff < twentyFourHours) {
          console.log('Install prompt was dismissed recently, not showing');
          return;
        }
      }
      
      setShowInstallPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('App installed event fired');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For testing purposes, show install prompt after 3 seconds if no beforeinstallprompt event
    const testTimer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        console.log('No beforeinstallprompt event detected, this might be due to:');
        console.log('1. App is already installed');
        console.log('2. Browser does not support PWA installation');
        console.log('3. PWA criteria not met');
        console.log('4. User has dismissed the prompt too many times');
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(testTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Hide for 24 hours
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Check if user dismissed recently - moved to separate effect to avoid conflicts
  useEffect(() => {
    const dismissedTime = localStorage.getItem('installPromptDismissed');
    if (dismissedTime) {
      const timeDiff = Date.now() - parseInt(dismissedTime);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (timeDiff < twentyFourHours) {
        console.log('Install prompt was dismissed recently, hiding for', Math.round((twentyFourHours - timeDiff) / (1000 * 60 * 60)), 'more hours');
        setShowInstallPrompt(false);
      } else {
        // Clear old dismissal if more than 24 hours have passed
        localStorage.removeItem('installPromptDismissed');
      }
    }
  }, [deferredPrompt]); // Run when deferredPrompt changes

  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg border border-blue-500/20 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {t.installApp || 'Cài đặt ứng dụng'}
              </h3>
              <p className="text-xs text-white/80">
                {t.installAppDescription || 'Truy cập nhanh hơn, hoạt động offline'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-white text-blue-600 font-medium py-2 px-4 rounded-md hover:bg-blue-50 transition-colors text-sm"
          >
            {t.install || 'Cài đặt'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm"
          >
            {t.later || 'Để sau'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;