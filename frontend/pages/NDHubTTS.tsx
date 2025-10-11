import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext'; 
import generateService from '../services/generateService';
import { SpeakerIcon, PlayIcon, PauseIcon, DownloadIcon, LoadingSpinner } from '../components/icons';
import AuthModal from '../components/AuthModal';
import CreditModal from '../components/CreditModal';
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

  // Helper function to get first voice for a language and gender
  const getFirstVoiceForLanguageAndGender = (lang: string, gender: string = 'all') => {
    if (!voiceData || !Array.isArray(voiceData)) {
      return 'af_heart'; // fallback
    }
    
    const filteredVoices = voiceData.filter((voice: VoiceOption) => {
      const langMatch = voice.lang === lang;
      const genderMatch = gender === 'all' || voice.gender === gender;
      return langMatch && genderMatch;
    });
    
    return filteredVoices.length > 0 ? filteredVoices[0].voice : 'af_heart';
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    content: ''
  });
  
  // TTS settings state - Initialize with proper defaults
  const [ttsSettings, setTtsSettings] = useState({
    lang: 'en-us', // Default to en-us
    voice: '', // Will be set in useEffect after voiceData is available
    format: 'mp3',
    speed: 1.0
  });

  const [genderFilter, setGenderFilter] = useState<string>('all'); // Default to 'all'
  
  const [userGenerates, setUserGenerates] = useState<Generate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; visible: boolean }>({ message: '', type: 'success', visible: false });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditModalData, setCreditModalData] = useState<{
    requiredCredits?: number;
    currentCredits?: number;
    message?: string;
  }>({});
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
    console.log('Auth status:', { isAuthenticated, user: user?.email });
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping fetch');
      return;
    }
    
    try {
      console.log('Fetching user generates...');
      const response = await generateService.getGenerates({
        type: 'audio',
        per_page: 10
      });
      
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        console.log('Setting userGenerates:', response.data);
        setUserGenerates(response.data);
      } else {
        console.log('No data or unsuccessful response:', response);
        setUserGenerates([]);
      }
    } catch (error) {
      console.error('Error fetching user generates:', error);
      setUserGenerates([]);
    }
  };

  useEffect(() => {
    fetchUserGenerates();
  }, [isAuthenticated, user]);

  // Initialize voice and gender filter when component mounts
  useEffect(() => {
    if (voiceData && Array.isArray(voiceData)) {
      // Initialize voice if not set
      if (!ttsSettings.voice) {
        const firstVoice = getFirstVoiceForLanguageAndGender('en-us', genderFilter);
        setTtsSettings(prev => ({
          ...prev,
          voice: firstVoice
        }));
      }
    }
  }, [voiceData, ttsSettings.voice, genderFilter]);

  // Auto-update voice when gender filter changes
  useEffect(() => {
    if (!ttsSettings.lang) return; // Guard against empty lang
    
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
        type: 'audio',
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
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo TTS';
      
      // Kiểm tra nếu lỗi liên quan đến credit
      if (errorMessage.toLowerCase().includes('credit') || 
          errorMessage.toLowerCase().includes('insufficient') ||
          errorMessage.toLowerCase().includes('không đủ')) {
        // Hiển thị modal thay vì toast cho lỗi credit
        setCreditModalData({
          message: errorMessage
        });
        setShowCreditModal(true);
      } else {
        showToast(errorMessage, 'error');
      }
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Ngôn ngữ
                    </label>
                    <Select
                      value={ttsSettings.lang}
                      onChange={(e) => {
                        if (!e || !e.target) return;
                        const newLang = e.target.value;
                        if (!newLang) return;
                        handleSettingChange('lang', newLang);
                        // Auto-select first voice for new language with current gender filter
                        const firstVoice = getFirstVoiceForLanguageAndGender(newLang, genderFilter);
                        handleSettingChange('voice', firstVoice);
                      }}
                      className="w-full"
                      options={uniqueLanguages || []}
                    />
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
                    onChange={(e) => {
                      if (!e || !e.target) return;
                      const newGender = e.target.value;
                      if (!newGender) return;
                      setGenderFilter(newGender);
                      // Auto-select first voice for current language with new gender filter
                      const firstVoice = getFirstVoiceForLanguageAndGender(ttsSettings.lang, newGender);
                      handleSettingChange('voice', firstVoice);
                    }}
                    className="w-full"
                    options={[
                      { value: 'all', label: 'Tất cả' },
                      { value: 'male', label: 'Nam' },
                      { value: 'female', label: 'Nữ' }
                    ]}
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
                          if (!e || !e.target) return;
                          const newVoice = e.target.value;
                          if (!newVoice) return;
                          handleSettingChange('voice', newVoice);
                          // Auto play preview when voice changes
                          const newVoiceData = voiceData && Array.isArray(voiceData) 
                            ? voiceData.find((v: VoiceOption) => v.voice === newVoice)
                            : null;
                          if (newVoiceData?.demo_link) {
                            setTimeout(() => playDemoVoice(newVoiceData.demo_link), 100);
                          }
                        }}
                        className="flex-1"
                        options={availableVoices || []}
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

                
                {/* Audio Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Định dạng audio
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['mp3', 'wav', 'aac', 'flac'].map((format) => (
                        <label
                          key={format}
                          className={`inline-flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                            ttsSettings.format === format
                              ? theme === 'dark'
                                ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                                : 'bg-blue-50 border-blue-500 text-blue-700'
                              : theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300'
                                : 'bg-white border-gray-300 hover:border-gray-400 text-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="format"
                            value={format}
                            checked={ttsSettings.format === format}
                            onChange={(e) => handleSettingChange('format', e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-3 h-3 rounded-full border-2 mr-2 flex items-center justify-center ${
                            ttsSettings.format === format
                              ? 'border-blue-500'
                              : theme === 'dark' ? 'border-gray-500' : 'border-gray-300'
                          }`}>
                            {ttsSettings.format === format && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            )}
                          </div>
                          <span className="font-medium text-sm uppercase">{format}</span>
                        </label>
                      ))}
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
                    <Card key={generate.id} padding="sm" className="hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {generate.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(generate.created_at).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Badge
                            variant="light"
                            color={
                              generate.status === 'processing' ? 'warning' :
                              generate.status === 'completed' ? 'success' :
                              generate.status === 'failed' ? 'error' : 'light'
                            }
                            size="sm"
                          >
                            {generate.status === 'processing' ? 'Processing' :
                             generate.status === 'completed' ? 'Completed' :
                             generate.status === 'failed' ? 'Failed' :
                             generate.status}
                          </Badge>
                        </div>
                        
                        {generate.status === 'completed' && generate.result_url && (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => playAudio(generate.result_url!, generate.name, generate.id)}
                              startIcon={<PlayIcon className="w-3 h-3" />}
                              className="flex-1"
                            >
                              Play
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadAudio(generate.result_url!, `${generate.name}.${ttsSettings.format}`)}
                              startIcon={<DownloadIcon className="w-3 h-3" />}
                              className="flex-1"
                            >
                              Download
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Last Generate Result Display */}
        {lastGenerateResult && (
          <Card className="mt-6 border-l-4 border-l-blue-500">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="inline-flex p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <SpeakerIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Yêu cầu tạo TTS đã được gửi
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Tên dự án:</span> {lastGenerateResult.name}</p>
                  <p><span className="font-medium">Trạng thái:</span> 
                    <Badge variant="light" color="warning" size="sm" className="ml-2">
                      {lastGenerateResult.status}
                    </Badge>
                  </p>
                  <p><span className="font-medium">Chi phí Credit:</span> {lastGenerateResult.credit_cost}</p>
                  {lastGenerateResult.task_id && (
                    <p><span className="font-medium">Task ID:</span> {lastGenerateResult.task_id}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
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

      {/* Credit Modal */}
      <CreditModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        message={creditModalData.message}
        requiredCredits={creditModalData.requiredCredits}
        currentCredits={creditModalData.currentCredits}
        onBuyCredits={() => {
          // Redirect to credit purchase page
          window.location.href = '/user-credit';
        }}
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