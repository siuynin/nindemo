
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { versionService } from './src/services/versionService';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    console.log('Attempting to register service worker...');
    
    // Check if we're in development mode
    const isDev = import.meta.env.DEV;
    console.log('Development mode:', isDev);
    
    try {
      const swUrl = '/sw.js';
      console.log('Registering service worker from:', swUrl);
      
      const registration = await navigator.serviceWorker.register(swUrl);
      console.log('SW registered successfully:', registration);
      console.log('SW scope:', registration.scope);
      
      // Start version checking for auto-reload on new deployments
      if (import.meta.env.PROD) {
        console.log('Starting version checking for auto-reload...');
        versionService.start();
      }
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('New service worker found:', newWorker);
        newWorker?.addEventListener('statechange', () => {
          console.log('Service worker state:', newWorker.state);
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New content available, please refresh.');
          }
        });
      });
      
      // Check current service worker
      const currentSw = await navigator.serviceWorker.getRegistration();
      console.log('Current service worker registration:', currentSw);
      
    } catch (registrationError) {
      console.error('SW registration failed:', registrationError);
      console.error('Error details:', {
        message: registrationError.message,
        name: registrationError.name,
        stack: registrationError.stack
      });
    }
  });
} else {
  console.warn('Service Worker not supported in this browser');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
