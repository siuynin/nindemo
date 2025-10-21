import React, { useState, useEffect } from 'react';

const PWATestWidget = () => {
  const [pwaStatus, setPwaStatus] = useState({
    serviceWorker: false,
    manifest: false,
    https: false,
    standalone: false,
    installable: false,
    platform: 'unknown'
  });

  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const checkPWAStatus = async () => {
      const status = {
        serviceWorker: 'serviceWorker' in navigator,
        manifest: 'relList' in document.createElement('link') && 
                  document.createElement('link').relList.supports('manifest'),
        https: location.protocol === 'https:' || 
               location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1',
        standalone: window.matchMedia('(display-mode: standalone)').matches,
        installable: false,
        platform: 'desktop'
      };

      // Detect platform
      const userAgent = navigator.userAgent;
      if (/iPad|iPhone|iPod/.test(userAgent)) {
        status.platform = 'ios';
      } else if (/Android/.test(userAgent)) {
        status.platform = 'android';
      }

      // Check service worker registration
      if (status.serviceWorker) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            status.installable = true;
          }
        } catch (error) {
          console.error('Service Worker check failed:', error);
        }
      }

      setPwaStatus(status);

      // Set debug info
      setDebugInfo(JSON.stringify({
        protocol: location.protocol,
        hostname: location.hostname,
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
      }, null, 2));
    };

    checkPWAStatus();

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setPwaStatus(prev => ({ ...prev, installable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    // This is a simplified version - in real app you'd use deferredPrompt
    if (pwaStatus.platform === 'ios') {
      alert('On iOS, tap the Share button and select "Add to Home Screen"');
    } else if (pwaStatus.platform === 'android') {
      alert('On Android, tap the menu button and select "Add to Home Screen"');
    } else {
      alert('Use your browser menu to install this app');
    }
  };

  const getStatusIcon = (status) => status ? '✅' : '❌';

  if (pwaStatus.standalone) {
    return null; // Don't show in standalone mode
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(59, 130, 246, 0.95)',
      color: 'white',
      padding: '15px',
      borderRadius: '15px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      maxWidth: '300px',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
        📱 Install NDhubs AI
      </h3>
      
      <div style={{ fontSize: '12px', marginBottom: '10px' }}>
        <div>{getStatusIcon(pwaStatus.serviceWorker)} Service Worker</div>
        <div>{getStatusIcon(pwaStatus.https)} HTTPS/Localhost</div>
        <div>{getStatusIcon(pwaStatus.standalone)} Standalone Mode</div>
        <div>{getStatusIcon(pwaStatus.platform !== 'desktop')} Mobile Support</div>
      </div>

      <button
        onClick={handleInstall}
        style={{
          background: 'white',
          color: '#3b82f6',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontWeight: 'bold',
          width: '100%',
          marginBottom: '5px'
        }}
      >
        {pwaStatus.platform === 'ios' ? 'Install (iOS)' :
         pwaStatus.platform === 'android' ? 'Install (Android)' :
         'Install App'}
      </button>

      <details style={{ fontSize: '10px', marginTop: '5px' }}>
        <summary style={{ cursor: 'pointer' }}>Debug Info</summary>
        <pre style={{ marginTop: '5px', whiteSpace: 'pre-wrap', fontSize: '8px' }}>
          {debugInfo}
        </pre>
      </details>
    </div>
  );
};

export default PWATestWidget;