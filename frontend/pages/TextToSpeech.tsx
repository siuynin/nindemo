import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SpeakerIcon, DownloadIcon, TrashIcon, PlusIcon, PlayIcon } from '../components/icons';
import { Card, Button, Badge } from '../components/ui';
import { generateService, type Generate } from '../services/generateService';
import elevenLabsService from '../services/elevenLabsService';
import ModernAudioPlayer from '../components/ModernAudioPlayer';

interface Voice {
  voice_id: string;
  name: string;
  language: any[];
  gender: string;
  age: string;
  category: string;
  preview_url: string;
  description?: string;
}

const TextToSpeech: React.FC = () => {
  const { theme } = useTheme();
  
  // Debug theme in development
  if (process.env.NODE_ENV === 'development') {
    console.log('TextToSpeech theme:', theme);
  }
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State for generated files (audio generates)
  const [generatedFiles, setGeneratedFiles] = useState<Generate[]>([]);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [voicesLoading, setVoicesLoading] = useState(true);

  // Audio player state
  const [audioPlayer, setAudioPlayer] = useState<{
    isVisible: boolean;
    audioUrl: string;
    title: string;
    isPlaying: boolean;
  }>({
    isVisible: false,
    audioUrl: '',
    title: '',
    isPlaying: false
  });

  const ttsServices = [
    {
      id: 'clone-voice',
      name: 'Clone Voice',
      description: t.textToSpeech?.cloneVoiceDesc || 'Clone and replicate any voice with AI',
      icon: <SpeakerIcon className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      url: '/voice-clone'
    },
    // {
    //   id: 'ndhub',
    //   name: 'NDhub',
    //   description: t.textToSpeech?.ndhubDesc || 'Professional Vietnamese TTS service',
    //   icon: <SpeakerIcon className="w-8 h-8" />,
    //   color: 'from-green-500 to-teal-500',
    //   url: '/ndhub-tts'
    // },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      description: t.textToSpeech?.elevenlabsDesc || 'High-quality AI voice generation',
      icon: <SpeakerIcon className="w-8 h-8" />,
      color: 'from-blue-500 to-indigo-500',
      url: '/elevenlabs'
    },
    {
      id: 'minmax',
      name: 'Minimax',
      description: t.textToSpeech?.minmaxDesc || 'Advanced voice synthesis technology',
      icon: <SpeakerIcon className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
      url: ''
    }
  ];

  // Fetch generated audio files
  const fetchGeneratedFiles = async () => {
    if (!isAuthenticated) {
      setGeneratedFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await generateService.getGenerates({
        type: 'audio',
        per_page: 10,
        status: 'completed'
      });
      
      if (response.success) {
        setGeneratedFiles(response.data);
      }
    } catch (error) {
      console.error('Error fetching generated files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available voices
  const fetchAvailableVoices = async () => {
    try {
      setVoicesLoading(true);
      const response = await elevenLabsService.fetchSharedVoices();
      
      if (response.voices) {
        // Get 10 random voices
        const shuffled = response.voices.sort(() => 0.5 - Math.random());
        setAvailableVoices(shuffled.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
    } finally {
      setVoicesLoading(false);
    }
  };

  // Handle play audio
  const handlePlayAudio = (generate: Generate) => {
    if (generate.result_url) {
      setAudioPlayer({
        isVisible: true,
        audioUrl: generate.result_url,
        title: generate.name || 'Audio',
        isPlaying: true // Set to true to auto-play
      });
    } else {
      alert('Không tìm thấy file audio để phát');
    }
  };

  // Handle download audio
  const handleDownloadAudio = (generate: Generate) => {
    if (generate.result_url) {
      const link = document.createElement('a');
      link.href = generate.result_url;
      link.download = `${generate.name || 'audio'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Không tìm thấy file audio để tải xuống');
    }
  };

  // Handle delete generate
  const handleDeleteGenerate = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa file audio này?')) return;
    
    try {
      const response = await generateService.deleteGenerate(id);
      if (response.success) {
        alert('Xóa file audio thành công');
        fetchGeneratedFiles();
      }
    } catch (error) {
      console.error('Error deleting generate:', error);
      alert('Không thể xóa file audio');
    }
  };

  // Handle play voice preview
  const handlePlayVoicePreview = (voice: Voice) => {
    if (voice.preview_url) {
      setAudioPlayer({
        isVisible: true,
        audioUrl: voice.preview_url,
        title: `${voice.name} Preview`,
        isPlaying: true // Set to true to auto-play
      });
    } else {
      alert('Không có preview audio cho voice này');
    }
  };

  // Handle use voice
  const handleUseVoice = (voice: Voice) => {
    // Navigate to ElevenLabs page with selected voice
    navigate('/app/elevenlabs', { state: { selectedVoice: voice } });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get language display name
  const getLanguageDisplay = (languages: any[]) => {
    if (!languages || languages.length === 0) return 'Unknown';
    return languages[0]?.name || 'Unknown';
  };

  useEffect(() => {
    fetchGeneratedFiles();
    fetchAvailableVoices();
  }, [isAuthenticated]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Page Header */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 ">
              {t.textToSpeech?.title || 'Text to Speech'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              {t.textToSpeech?.subtitle || 'Convert your text to natural-sounding speech with AI-powered voices'}
            </p>
          </div>

          {/* TTS Services Grid */}
          <div className="mb-8"> 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ttsServices.map((service) => (
                <a 
                  href={service.id === 'elevenlabs' ? '/elevenlabs' : service.id === 'minmax' ? '/minimax' : service.url}
                  target={service.id === 'elevenlabs' || service.id === 'minmax' ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  key={service.id}
                  className="block"
                >
                  <Card
                    hover={true}
                    className="cursor-pointer group relative z-50 pointer-events-auto"
                  >
                  <div className="flex flex-col h-full">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${service.color} text-white mb-3 w-fit`}>
                      {service.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90  group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">
                      {service.description}
                    </p> 
                  </div>
                </Card>
                </a>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Generated Files */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  {t.textToSpeech?.generatedFiles || 'Generated Audio Files'}
                </h2>
                <Badge variant="light" color="primary">
                  {generatedFiles.length} {t.textToSpeech?.files || 'files'}
                </Badge>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                  </div>
                ) : generatedFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      {isAuthenticated ? 'Chưa có file audio nào được tạo' : 'Đăng nhập để xem file audio của bạn'}
                    </p>
                  </div>
                ) : (
                  generatedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                        theme === 'dark'
                          ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-800 dark:text-white/90 mb-1 truncate">
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="light" color="success" size="sm">
                              Audio
                            </Badge>
                            <Badge variant="light" color="info" size="sm">
                              {file.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(file.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="!p-2"
                            onClick={() => handlePlayAudio(file)}
                            title="Play audio"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="!p-2"
                            onClick={() => handleDownloadAudio(file)}
                            title="Download audio"
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="!p-2 !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-500/10"
                            onClick={() => handleDeleteGenerate(file.id)}
                            title="Delete audio"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Available Voices */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  {t.textToSpeech?.availableVoices || 'Available Voices'}
                </h2>
                <Badge variant="light" color="info">
                  {availableVoices.length} voices
                </Badge>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {voicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                  </div>
                ) : availableVoices.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      Không thể tải danh sách voices
                    </p>
                  </div>
                ) : (
                  availableVoices.map((voice) => (
                    <div
                      key={voice.voice_id}
                      className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                        theme === 'dark'
                          ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-800 dark:text-white/90 mb-1">
                            {voice.name}
                          </h4>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="light" color="success" size="sm">
                              {getLanguageDisplay(voice.language)}
                            </Badge>
                            <Badge variant="light" color="info" size="sm">
                              {voice.gender}
                            </Badge>
                            <Badge variant="light" color="warning" size="sm">
                              {voice.age}
                            </Badge>
                          </div>
                          {voice.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                              {voice.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="!p-2"
                            onClick={() => handlePlayVoicePreview(voice)}
                            title="Play preview"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            className="!px-3 !py-1 !text-xs"
                            onClick={() => handleUseVoice(voice)}
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      <ModernAudioPlayer
        title={audioPlayer.title}
        audioUrl={audioPlayer.audioUrl}
        isVisible={audioPlayer.isVisible}
        onClose={() => setAudioPlayer(prev => ({ ...prev, isVisible: false }))}
        onDownload={() => {
          if (audioPlayer.audioUrl) {
            const link = document.createElement('a');
            link.href = audioPlayer.audioUrl;
            link.download = `${audioPlayer.title}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }}
        autoPlay={false}
      />
    </div>
  );
};

export default TextToSpeech;