import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import HomeLayout from './components/HomeLayout';
import HomePage from './pages/HomePage';
import TextToSpeech from './pages/TextToSpeech';
import Document from './pages/Document';
import Creation from './pages/Creation';
import PublicDocument from './pages/PublicDocument';
import ElevenLabs from './pages/ElevenLabs';
import Minimax from './pages/Minimax';
import VoiceClone from './pages/VoiceClone';
import Price from './pages/Price';
import CreativeEditor from './pages/CreativeEditor';
import ImageTools from './pages/ImageTools';
import UserCredit from './pages/UserCredit';
import VideoGeneration from './pages/VideoGeneration';
import NDHubTTS from './pages/NDHubTTS';
import App from './App';
import DebugRunware from './debug-runware';
import UpScaler from './pages/image-tool/UpScaler';

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
    element: <AdminLayout />,
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
        path: 'ndhub-tts',
        element: <NDHubTTS />,
      },
      {
        path: 'document',
        element: <Document />,
      },
      {
        path: 'creation',
        element: <Creation />,
      },
      {
        path: 'elevenlabs',
        element: <ElevenLabs />,
      },
      {
        path: 'minimax',
        element: <Minimax />,
      },
      {
        path: 'voice-clone',
        element: <VoiceClone />,
      },
      {
        path: 'price',
        element: <Price />,
      },
      {
        path: 'debug-runware',
        element: <DebugRunware />,
      },
      {
        path: 'creative-editor',
        element: <CreativeEditor />,
      },
      {
        path: 'image-tools',
        element: <ImageTools />,
        children: [
          {
            index: true,
            element: <div>Select an image tool</div>,
          },
          {
            path: 'upscaler',
            element: <UpScaler />,
          },
        ],
      },
      {
        path: 'user-credit',
        element: <UserCredit />,
      },
      {
        path: 'video-generation',
        element: <VideoGeneration />,
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
    path: '/ndhub-tts',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <NDHubTTS />,
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
    path: '/creation',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Creation />,
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
    path: '/minimax',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Minimax />,
      },
    ],
  },
  {
    path: '/voice-clone',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <VoiceClone />,
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
  {
    path: '/creative-editor',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <CreativeEditor />,
      },
    ],
  },
  {
    path: '/image-tools',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <ImageTools />,
      },
      {
        path: 'upscaler',
        element: <UpScaler />,
      },
    ],
  },
  {
    path: '/user-credit',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <UserCredit />,
      },
    ],
  },
]);

export default router;