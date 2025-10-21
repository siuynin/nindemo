import React, { useState, useEffect } from 'react';

const SimpleInstallPrompt = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState('');
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Check if app is in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Detect platform
    const userAgent = navigator.userAgent;
    let detectedPlatform = 'desktop';
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      detectedPlatform = 'ios';
    } else if (/Android/.test(userAgent)) {
      detectedPlatform = 'android';
    } else if (/Windows Phone/.test(userAgent)) {
      detectedPlatform = 'windows';
    }
    setPlatform(detectedPlatform);

    // Debug info
    setDebugInfo({
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      isHttps: window.location.protocol === 'https:',
      serviceWorkerSupport: 'serviceWorker' in navigator,
      standaloneSupport: 'standalone' in navigator,
      userAgent: navigator.userAgent.substring(0, 100) + '...'
    });

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Handle appinstalled event
    const handleAppInstalled = () => {
      console.log('App installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('User response:', outcome);
        
        if (outcome === 'accepted') {
          console.log('User accepted installation');
        } else {
          console.log('User dismissed installation');
        }
        
        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (error) {
        console.error('Installation error:', error);
      }
    } else {
      // Fallback for iOS or when beforeinstallprompt is not available
      if (platform === 'ios') {
        alert('To install this app on iOS:\\n1. Tap the Share button\\n2. Scroll down and tap "Add to Home Screen"\\n3. Tap "Add" in the top right');
      } else if (platform === 'android') {
        alert('To install this app on Android:\\n1. Tap the menu button (3 dots)\\n2. Tap "Add to Home Screen"\\n3. Tap "Add"');
      } else {
        alert('Installation not available. Please use the browser menu to add to home screen.');
      }
    }
  };

  if (isStandalone) {
    return null; // Don't show prompt if app is already installed
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '15px 20px',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      maxWidth: '300px'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        Install NDhubs AI App
      </div>
      <div style={{ marginBottom: '15px', fontSize: '14px' }}>
        Get quick access to our AI creative assistant!
      </div>
      <button
        onClick={handleInstallClick}
        style={{
          backgroundColor: 'white',
          color: '#3b82f6',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          width: '100%'
        }}
      >
        {deferredPrompt ? 'Install App' : 
         platform === 'ios' ? 'Install (iOS)' :
         platform === 'android' ? 'Install (Android)' :
         'Install'}
      </button>
      
      {/* Debug Info */}
      <details style={{ marginTop: '10px', fontSize: '12px' }}>
        <summary>Debug Info</summary>
        <pre style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default SimpleInstallPrompt;