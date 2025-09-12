import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SpeakerIcon, DownloadIcon, TrashIcon, PlusIcon } from '../components/icons';

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
}

interface GeneratedFile {
  id: string;
  name: string;
  service: string;
  createdAt: string;
  url: string;
}

const TextToSpeech: React.FC = () => {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const ttsServices = [
    {
      id: 'clone-voice',
      name: 'Clone Voice',
      description: t.textToSpeech?.cloneVoiceDesc || 'Clone and replicate any voice with AI',
      icon: <SpeakerIcon className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      url: 'https://clonevoice.ai'
    },
    {
      id: 'ndhub',
      name: 'NDhub',
      description: t.textToSpeech?.ndhubDesc || 'Professional Vietnamese TTS service',
      icon: <SpeakerIcon className="w-8 h-8" />,
      color: 'from-green-500 to-teal-500',
      url: 'https://ndhub.vn'
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      description: t.textToSpeech?.elevenlabsDesc || 'High-quality AI voice generation',
      icon: <SpeakerIcon className="w-8 h-8" />,
      color: 'from-blue-500 to-indigo-500',
      url: 'https://elevenlabs.io'
    },
    {
      id: 'minmax',
      name: 'Min Max',
      description: t.textToSpeech?.minmaxDesc || 'Advanced voice synthesis technology',
      icon: <SpeakerIcon className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
      url: 'https://minmax.ai'
    }
  ];

  const generatedFiles: GeneratedFile[] = [
    {
      id: '1',
      name: 'Welcome Message.mp3',
      service: 'ElevenLabs',
      createdAt: '2024-01-15 10:30',
      url: 'https://example.com/file1.mp3'
    },
    {
      id: '2',
      name: 'Product Demo.wav',
      service: 'Clone Voice',
      createdAt: '2024-01-15 09:15',
      url: 'https://example.com/file2.wav'
    },
    {
      id: '3',
      name: 'Announcement.mp3',
      service: 'NDhub',
      createdAt: '2024-01-14 16:45',
      url: 'https://example.com/file3.mp3'
    }
  ];

  const availableVoices: Voice[] = [
    { id: '1', name: 'Sarah', language: 'English', gender: 'Female' },
    { id: '2', name: 'John', language: 'English', gender: 'Male' },
    { id: '3', name: 'Minh', language: 'Vietnamese', gender: 'Male' },
    { id: '4', name: 'Linh', language: 'Vietnamese', gender: 'Female' },
    { id: '5', name: 'Custom Voice 1', language: 'English', gender: 'Male' },
    { id: '6', name: 'Custom Voice 2', language: 'Vietnamese', gender: 'Female' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {t.textToSpeech?.title || 'Text to Speech'}
          </h1>
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t.textToSpeech?.subtitle || 'Convert your text to natural-sounding speech with AI-powered voices'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {ttsServices.map((service) => (
            <div
              key={service.id}
              onClick={() => {
                if (service.id === 'elevenlabs') {
                  navigate('/app/elevenlabs');
                } else {
                  window.open(service.url, '_blank');
                }
              }}
              className={`relative p-6 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-750'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${service.color} text-white mb-4`}>
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {service.description}
              </p>
              <div className="absolute top-4 right-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`p-6 rounded-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {t.textToSpeech?.generatedFiles || 'Generated Files'}
              </h2>
              <span className={`text-sm px-2 py-1 rounded-full ${
                theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                {generatedFiles.length} {t.textToSpeech?.files || 'files'}
              </span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{file.name}</h4>
                      <p className={`text-xs mb-2 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {file.service}
                      </p>
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {file.createdAt}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-2">
                      <button className={`p-1 rounded hover:bg-opacity-20 ${
                        theme === 'dark' ? 'hover:bg-white' : 'hover:bg-gray-600'
                      }`}>
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                      <button className={`p-1 rounded hover:bg-opacity-20 text-red-500 ${
                        theme === 'dark' ? 'hover:bg-red-500' : 'hover:bg-red-500'
                      }`}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-6 rounded-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {t.textToSpeech?.availableVoices || 'Available Voices'}
              </h2>
              <button className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}>
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableVoices.map((voice) => (
                <div
                  key={voice.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm mb-1">{voice.name}</h4>
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {voice.language} • {voice.gender}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full opacity-50"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;