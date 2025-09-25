import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import HomeLayout from './components/HomeLayout';
import HomePage from './pages/HomePage';
import TextToSpeech from './pages/TextToSpeech';
import Document from './pages/Document';
import PublicDocument from './pages/PublicDocument';
import ElevenLabs from './pages/ElevenLabs';
import Price from './pages/Price';
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
  // Public document route (no layout)
  {
    path: '/docs/:id',
    element: <PublicDocument />,
  },
  {
    path: '/app',
    element: <AdminLayout />,
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
        path: 'write-assistant/:name',
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
      {
        path: 'price',
        element: <Price />,
      },
    ],
  },
  // Legacy routes for backward compatibility
  {
    path: '/image-canvas',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <CanvasPage />,
      },
    ],
  },
  {
    path: '/write-assistant',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <WriteAssistantPage />,
      },
      {
        path: ':name',
        element: <WriteAssistantPage />,
      },
    ],
  },
  {
    path: '/image-creator',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <ImageCreatorPage />,
      },
    ],
  },
  {
    path: '/text-to-speech',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <TextToSpeech />,
      },
    ],
  },
  {
    path: '/document',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Document />,
      },
    ],
  },
  {
    path: '/elevenlabs',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <ElevenLabs />,
      },
    ],
  },
  {
    path: '/price',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Price />,
      },
    ],
  },
]);

export default router;