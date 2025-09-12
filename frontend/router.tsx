import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import HomeLayout from './components/HomeLayout';
import HomePage from './pages/HomePage';
import TextToSpeech from './pages/TextToSpeech';
import Document from './pages/Document';
import ElevenLabs from './pages/ElevenLabs';
import App from './App';

// Wrapper component for Canvas page
const CanvasPage: React.FC = () => {
  return <App pageOverride="canvas" />;
};

// Wrapper component for Write Assistant page
const WriteAssistantPage: React.FC = () => {
  return <App pageOverride="write" />;
};

// Wrapper component for Image Creator page
const ImageCreatorPage: React.FC = () => {
  return <App pageOverride="image-creator" />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
  {
    path: '/app',
    element: <Layout />,
    children: [
      {
        path: 'image-canvas',
        element: <CanvasPage />,
      },
      {
        path: 'write-assistant',
        element: <WriteAssistantPage />,
      },
      {
        path: 'image-creator',
        element: <ImageCreatorPage />,
      },
      {
        path: 'text-to-speech',
        element: <TextToSpeech />,
      },
      {
        path: 'document',
        element: <Document />,
      },
      {
        path: 'elevenlabs',
        element: <ElevenLabs />,
      },
    ],
  },
  // Legacy routes for backward compatibility
  {
    path: '/image-canvas',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <CanvasPage />,
      },
    ],
  },
  {
    path: '/write-assistant',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <WriteAssistantPage />,
      },
    ],
  },
  {
    path: '/image-creator',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ImageCreatorPage />,
      },
    ],
  },
  {
    path: '/text-to-speech',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <TextToSpeech />,
      },
    ],
  },
]);

export default router;