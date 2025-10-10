import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext'; 
import generateService from '../services/generateService';
import { SpeakerIcon, PlayIcon, PauseIcon, DownloadIcon, LoadingSpinner } from '../components/icons';
import AuthModal from '../components/AuthModal';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import { Card, Button, Badge, Input, TextArea, Select } from '../components/ui';
import voiceData from '../voice1.json';

interface VoiceOption {
  lang: string;
  voice: string;
  gender: string;
  name: string;
  demo_link: string;
  provider: string;
  language: string;
}

interface Generate {
  id: number;
  name: string;
  status: string;
  created_at: string;
  credit_cost: number;
  task_id?: string;
  result_url?: string;
}

const NDHubTTS: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Set page title
  useEffect(() => {
    document.title = 'NDHub TTS - AI App';
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    content: ''
  });
  
  // TTS settings state
  const [ttsSettings, setTtsSettings] = useState({
    lang: 'en-us',
    voice: 'af_heart',
    format: 'mp3',
    speed: 1.0
  });

  const [genderFilter, setGenderFilter] = useState<string>('all'); // New gender filter state: 'all', 'male', 'female'
  
  const [userGenerates, setUserGenerates] = useState<Generate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; visible: boolean }>({ message: '', type: 'success', visible: false });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [lastGenerateResult, setLastGenerateResult] = useState<{
    id: number;
    name: string;
    status: string;
    credit_cost: number;
    task_id?: string;
  } | null>(null);
  
  // Audio player state
  const [audioPlayer, setAudioPlayer] = useState<{
    isVisible: boolean;
    title: string;
    audioUrl: string;
    generateId?: number;
  }>({
    isVisible: false,
    title: '',
    audioUrl: '',
    generateId: undefined
  });

  // Get unique languages and voices from voice data
  const getUniqueLanguages = () => {
    if (!voiceData || !Array.isArray(voiceData)) {
      return [];
    }
    const languages = voiceData.reduce((acc: any[], voice: VoiceOption) => {
      if (!acc.find(lang => lang.value === voice.lang)) {
        acc.push({
          value: voice.lang,
          label: voice.language
        });
      }
      return acc;
    }, []);
    return languages;
  };

  const getVoicesForLanguage = (lang: string) => {
    if (!voiceData || !Array.isArray(voiceData)) {
      return [];
    }
    return voiceData
      .filter((voice: VoiceOption) => {
        const langMatch = voice.lang === lang;
        const genderMatch = genderFilter === 'all' || voice.gender === genderFilter;
        return langMatch && genderMatch;
      })
      .map((voice: VoiceOption) => ({
        value: voice.voice,
        label: `${voice.name} (${voice.gender})`,
        demo_link: voice.demo_link,
        gender: voice.gender
      }));
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Fetch user generates
  const fetchUserGenerates = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await generateService.getGenerates({
        type: 'ndhub-tts',
        per_page: 10,
        page: 1
      });
      
      if (response.success && response.data) {
        setUserGenerates(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching generates:', error);
    }
  };

  useEffect(() => {
    fetchUserGenerates();
  }, [isAuthenticated]);

  // Auto-update voice when gender filter changes
  useEffect(() => {
    const currentVoices = getVoicesForLanguage(ttsSettings.lang);
    const currentVoiceExists = currentVoices.some(v => v.value === ttsSettings.voice);
    
    // If current voice doesn't exist in filtered results, select the first available voice
    if (!currentVoiceExists && currentVoices.length > 0) {
      handleSettingChange('voice', currentVoices[0].value);
    }
  }, [genderFilter, ttsSettings.lang]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle TTS settings changes
  const handleSettingChange = (field: string, value: string | number) => {
    setTtsSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!formData.content.trim()) {
      showToast('Vui lòng nhập nội dung cần chuyển đổi', 'error');
      return;
    }

    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên cho file audio', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await generateService.createGenerate({
        type: 'ndhub-tts',
        name: formData.name,
        content: formData.content,
        lang: ttsSettings.lang,
        voices: ttsSettings.voice,
        audio_format: ttsSettings.format,
        speed: ttsSettings.speed
      });

      if (response.success && response.data) {
        setLastGenerateResult({
          id: response.data.id,
          name: response.data.name,
          status: response.data.status,
          credit_cost: response.data.credit_cost,
          task_id: response.data.task_id
        });
        
        showToast(`Đã tạo yêu cầu TTS thành công! Chi phí: ${response.data.credit_cost} credits`, 'success');
        
        // Reset form
        setFormData({ name: '', content: '' });
        
        // Refresh generates list
        fetchUserGenerates();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi tạo TTS', 'error');
      }
    } catch (error: any) {
      console.error('Error creating TTS:', error);
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi tạo TTS', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio
  const playAudio = (url: string, title: string, generateId?: number) => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(null);
    }

    setAudioPlayer({
      isVisible: true,
      audioUrl: url,
      title: title,
      generateId: generateId
    });
  };

  // Download audio
  const downloadAudio = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Play demo voice
  const playDemoVoice = (demoUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(null);
    }

    const audio = new Audio(demoUrl);
    setCurrentAudio(audio);
    setIsPlaying(demoUrl);
    
    audio.play().catch(error => {
      console.error('Error playing demo:', error);
      showToast('Không thể phát demo giọng nói', 'error');
    });

    audio.onended = () => {
      setCurrentAudio(null);
      setIsPlaying(null);
    };
  };

  const uniqueLanguages = getUniqueLanguages();
  const availableVoices = getVoicesForLanguage(ttsSettings.lang);
  const selectedVoiceData = voiceData && Array.isArray(voiceData) 
    ? voiceData.find((v: VoiceOption) => v.voice === ttsSettings.voice)
    : null;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            NDHub Text to Speech
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Chuyển đổi văn bản thành giọng nói chất lượng cao với công nghệ AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className={`p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Input */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Tên file audio
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nhập tên cho file audio..."
                    className="w-full"
                  />
                </div>

                {/* Content Input */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Nội dung ({formData.content.length} ký tự)
                  </label>
                  <TextArea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Nhập văn bản cần chuyển đổi thành giọng nói..."
                    rows={6}
                    className="w-full"
                  />
                </div>

                {/* Language Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Ngôn ngữ
                    </label>
                    <Select
                      value={ttsSettings.lang}
                      onChange={(e) => {
                        handleSettingChange('lang', e.target.value);
                        // Reset voice when language changes
                        const newVoices = getVoicesForLanguage(e.target.value);
                        if (newVoices.length > 0) {
                          handleSettingChange('voice', newVoices[0].value);
                        }
                      }}
                      className="w-full"
                      options={uniqueLanguages}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Giọng nói
                    </label>
                    <div className="flex gap-2">
                      <Select
                        value={ttsSettings.voice}
                        onChange={(e) => {
                          handleSettingChange('voice', e.target.value);
                          // Auto play preview when voice changes
                          const newVoiceData = voiceData && Array.isArray(voiceData) 
                            ? voiceData.find((v: VoiceOption) => v.voice === e.target.value)
                            : null;
                          if (newVoiceData?.demo_link) {
                            setTimeout(() => playDemoVoice(newVoiceData.demo_link), 100);
                          }
                        }}
                        className="flex-1"
                        options={availableVoices}
                      />
                      {selectedVoiceData?.demo_link && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => playDemoVoice(selectedVoiceData.demo_link)}
                          disabled={isPlaying === selectedVoiceData.demo_link}
                        >
                          {isPlaying === selectedVoiceData.demo_link ? (
                            <PauseIcon className="w-4 h-4" />
                          ) : (
                            <PlayIcon className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Lọc theo giới tính
                  </label>
                  <Select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full"
                    options={[
                      { value: 'all', label: 'Tất cả' },
                      { value: 'male', label: 'Nam' },
                      { value: 'female', label: 'Nữ' }
                    ]}
                  />
                </div>

                {/* Audio Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Định dạng audio
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="format"
                          value="mp3"
                          checked={ttsSettings.format === 'mp3'}
                          onChange={(e) => handleSettingChange('format', e.target.value)}
                          className="mr-2"
                        />
                        MP3
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="format"
                          value="wav"
                          checked={ttsSettings.format === 'wav'}
                          onChange={(e) => handleSettingChange('format', e.target.value)}
                          className="mr-2"
                        />
                        WAV
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="format"
                          value="ogg"
                          checked={ttsSettings.format === 'ogg'}
                          onChange={(e) => handleSettingChange('format', e.target.value)}
                          className="mr-2"
                        />
                        OGG
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Tốc độ ({ttsSettings.speed}x)
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={ttsSettings.speed}
                      onChange={(e) => handleSettingChange('speed', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !formData.content.trim() || !formData.name.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <SpeakerIcon className="w-4 h-4 mr-2" />
                      Tạo giọng nói
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Sidebar - Recent Generates */}
          <div className="lg:col-span-1">
            <Card className={`p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-semibold mb-4">File audio gần đây</h3>
              
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Đăng nhập để xem lịch sử
                  </p>
                  <Button
                    onClick={() => setIsAuthModalOpen(true)}
                    variant="outline"
                  >
                    Đăng nhập
                  </Button>
                </div>
              ) : userGenerates.length === 0 ? (
                <div className="text-center py-8">
                  <SpeakerIcon className={`w-12 h-12 mx-auto mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Chưa có file audio nào
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userGenerates.map((generate) => (
                    <div
                      key={generate.id}
                      className={`p-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">{generate.name}</h4>
                        <Badge
                          variant={generate.status === 'completed' ? 'success' : 
                                 generate.status === 'failed' ? 'error' : 'warning'}
                        >
                          {generate.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {new Date(generate.created_at).toLocaleDateString('vi-VN')}
                        </span>
                        
                        {generate.status === 'completed' && generate.result_url && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => playAudio(generate.result_url!, generate.name, generate.id)}
                            >
                              <PlayIcon className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadAudio(generate.result_url!, `${generate.name}.${ttsSettings.format}`)}
                            >
                              <DownloadIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-yellow-500 text-black'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* Audio Player */}
      {audioPlayer.isVisible && (
        <ModernAudioPlayer
          audioUrl={audioPlayer.audioUrl}
          title={audioPlayer.title}
          onClose={() => setAudioPlayer(prev => ({ ...prev, isVisible: false }))}
          generateId={audioPlayer.generateId}
        />
      )}
    </div>
  );
};

export default NDHubTTS;