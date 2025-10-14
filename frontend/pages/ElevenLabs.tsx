import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext'; 
import generateService from '../services/generateService';
import userCreditService from '../services/userCreditService';
import { SpeakerIcon, PlayIcon, PauseIcon, DownloadIcon, LoadingSpinner } from '../components/icons';
import AuthModal from '../components/AuthModal';
import CreditModal from '../components/CreditModal';
import VoiceSelectionModal from '../components/VoiceSelectionModal';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import { ElevenLabsVoice } from '../types';
import { Card, Button, Badge, Input, TextArea, Select } from '../components/ui';

interface Generate {
  id: number;
  name: string;
  status: string;
  created_at: string;
  credit_cost: number;
  task_id?: string;
  result_url?: string;
}

const ElevenLabs: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Set page title
  useEffect(() => {
    document.title = 'ElevenLabs - AI App';
  }, []);

  // Check for selected voice from navigation state
  useEffect(() => {
    if (location.state && location.state.selectedVoice) {
      setSelectedVoice(location.state.selectedVoice);
      // Clear the state to prevent re-setting on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    content: ''
  });
  
  // Model and voice settings state
  const [selectedModel, setSelectedModel] = useState<'eleven_turbo_v2_5' | 'eleven_v3'>('eleven_turbo_v2_5');
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 0.97,
    style: 0,
    stability: 0.5,
    similarity_boost: 0.61,
    use_speaker_boost: true
  });
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
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

  // Handle voice selection
  const handleVoiceSelect = (voice: ElevenLabsVoice) => {
    console.log('ElevenLabs: handleVoiceSelect called with voice:', voice);
    console.log('ElevenLabs: Setting selectedVoice to:', voice);
    
    setSelectedVoice(voice);
    console.log('ElevenLabs: selectedVoice state updated');
    
    console.log('ElevenLabs: Setting isVoiceModalOpen to false');
    setIsVoiceModalOpen(false);
    console.log('ElevenLabs: isVoiceModalOpen state updated');
  };

  // Handle model change and reset voice settings
  useEffect(() => {
    // Reset voice settings when model changes
    if (selectedModel === 'eleven_turbo_v2_5') {
      setVoiceSettings({
        speed: 0.97,
        style: 0,
        stability: 0.5,
        similarity_boost: 0.61,
        use_speaker_boost: true
      });
    } else if (selectedModel === 'eleven_v3') {
      setVoiceSettings({
        speed: 0.97, // Keep for consistency but won't be sent
        style: 0,
        stability: 0.5,
        similarity_boost: 0.61, // Keep for consistency but won't be sent
        use_speaker_boost: true
      });
    }
  }, [selectedModel]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Giới hạn ký tự cho content dựa trên model
    if (name === 'content') {
      const maxLength = selectedModel === 'eleven_turbo_v2_5' ? 20000 : 3000;
      if (value.length > maxLength) {
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  // Load user generates on component mount and auth change
  useEffect(() => {
    fetchUserGenerates();
  }, [isAuthenticated, user]);

  // Auto-check status for processing generates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const processingGenerates = userGenerates.filter(
      generate => generate.status === 'processing' || generate.status === 'pending'
    );

    if (processingGenerates.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const response = await generateService.getGenerates({
          type: 'audio',
          per_page: 10
        });
        
        if (response.success && response.data) {
          setUserGenerates(response.data);
          
          // Check if lastGenerateResult needs updating
          if (lastGenerateResult && (lastGenerateResult.status === 'processing' || lastGenerateResult.status === 'pending')) {
            const updatedGenerate = response.data.find(g => g.id === lastGenerateResult.id);
            if (updatedGenerate && updatedGenerate.status !== lastGenerateResult.status) {
              setLastGenerateResult({
                ...lastGenerateResult,
                status: updatedGenerate.status
              });
              
              if (updatedGenerate.status === 'completed') {
                showToast(`Audio generation "${updatedGenerate.name}" completed successfully!`, 'success');
              } else if (updatedGenerate.status === 'failed') {
                showToast(`Audio generation "${updatedGenerate.name}" failed.`, 'error');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking generate status:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [userGenerates, lastGenerateResult, isAuthenticated, user]);

  // Handle voice preview
  const handleVoicePreview = (voiceId: string, previewUrl?: string) => {
    console.log('ElevenLabs handleVoicePreview called:', { voiceId, previewUrl, currentPlaying: isPlaying });
    
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    if (isPlaying === voiceId) {
      console.log('Stopping current audio');
      setIsPlaying(null);
    } else {
      setIsPlaying(voiceId);
      
      // Find preview URL for this voice
      let audioUrl = previewUrl;
      if (!audioUrl && selectedVoice && selectedVoice.voice_id === voiceId) {
        audioUrl = selectedVoice.preview_url;
      }
      
      console.log('Playing audio with URL:', audioUrl);
      
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        setCurrentAudio(audio);
        
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          showToast('Không thể phát audio preview', 'error');
          setIsPlaying(null);
          setCurrentAudio(null);
        });
        
        audio.onended = () => {
          console.log('Audio ended');
          setIsPlaying(null);
          setCurrentAudio(null);
        };
        audio.onerror = () => {
          console.log('Audio error');
          setIsPlaying(null);
          setCurrentAudio(null);
          showToast('Lỗi khi tải audio preview', 'error');
        };
      } else {
        showToast('Không tìm thấy audio preview cho voice này', 'warning');
        setIsPlaying(null);
      }
    }
  };

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication first
    if (!isAuthenticated || !user) {
      showToast('Bạn cần đăng nhập để sử dụng tính năng này', 'warning');
      setIsAuthModalOpen(true);
      return;
    }
    
    if (!formData.name.trim() || !formData.content.trim() || !selectedVoice) {
      showToast('Vui lòng điền đầy đủ thông tin và chọn voice', 'warning');
      return;
    }

    setIsLoading(true);
    
    try {
      // Estimate credit cost based on content length (approximate)
      const contentLength = formData.content.trim().length;
      const estimatedCost = Math.ceil(contentLength / 80); // ElevenLabs typically costs more: 1 credit per 80 characters
      
      // Check if user has sufficient credits
      const hasSufficientCredits = await userCreditService.checkSufficientCredits(estimatedCost);
      if (!hasSufficientCredits) {
        setCreditModalData({
          message: `Bạn cần ít nhất ${estimatedCost} credits để tạo audio này. Vui lòng nạp thêm credits để tiếp tục.`
        });
        setShowCreditModal(true);
        setIsLoading(false);
        return;
      }

      // Prepare voice settings based on selected model
      const requestVoiceSettings: any = {
        stability: voiceSettings.stability,
        style: voiceSettings.style,
        use_speaker_boost: voiceSettings.use_speaker_boost
      };

      // Add additional settings for turbo_v2_5 model
      if (selectedModel === 'eleven_turbo_v2_5') {
        requestVoiceSettings.speed = voiceSettings.speed;
        requestVoiceSettings.similarity_boost = voiceSettings.similarity_boost;
      }

      // First, create generates record with status 'pending'
      const generateResponse = await generateService.createGenerate({
        name: formData.name.trim(),
        content: formData.content.trim(),
        type: 'audio',
        status: 'pending',
        voice_id: selectedVoice.voice_id,
        model: selectedModel,
        voice_settings: requestVoiceSettings
      });
      
      if (!generateResponse.success || !generateResponse.data.id) {
        throw new Error('Failed to create generate record');
      }

      // Backend will automatically handle ElevenLabs API call
      // Store the generate result to display to user
      setLastGenerateResult({
        id: generateResponse.data.id,
        name: generateResponse.data.name,
        status: generateResponse.data.status,
        credit_cost: generateResponse.data.credit_cost,
        task_id: generateResponse.data.task_id
      });
      
      showToast(`Yêu cầu tạo audio đã được gửi thành công! Task ID: ${generateResponse.data.task_id || 'N/A'}`, 'success');
      
      // Reset form and refresh generates list
      setFormData({ name: '', content: '' });
      setSelectedVoice(null);
      fetchUserGenerates();
    } catch (error) {
      console.error('Error in submission process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
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
        showToast('Có lỗi xảy ra khi gửi yêu cầu: ' + errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <SpeakerIcon className="w-8 h-8" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ElevenLabs
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                High-quality AI voice generation with natural speech synthesis
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Form - Takes 2 columns on xl screens */}
            <div className="xl:col-span-2 space-y-6">
              {/* Project Information Card */}
              <Card className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Project Information
                  </h2> 
                </div>

                <div className="space-y-6">
                  {/* Project Name */}
                  <Input
                    label="Project Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter a descriptive name for your project..."
                    className="w-full"
                  />

                  {/* Voice Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Voice Selection
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    
                    {/* Voice Selection Button with Selected Voice Info */}
                    <Button
                      variant="outline"
                      onClick={() => setIsVoiceModalOpen(true)}
                      className="w-full p-4 h-auto justify-between text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <SpeakerIcon className="w-5 h-5 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          {selectedVoice ? (
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {selectedVoice.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {Array.isArray(selectedVoice.language) 
                                  ? selectedVoice.language.map(lang => 
                                      typeof lang === 'object' && lang.language ? lang.language : lang
                                    ).join(', ').toUpperCase()
                                  : (typeof selectedVoice.language === 'string' ? selectedVoice.language.toUpperCase() : 'N/A')
                                } • {selectedVoice.gender} • {selectedVoice.age}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 dark:text-gray-400">
                              Select Voice
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedVoice && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVoicePreview(selectedVoice.voice_id);
                            }}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md cursor-pointer transition-colors mr-2"
                          >
                            {isPlaying === selectedVoice.voice_id ? 
                              <PauseIcon className="w-3 h-3 mr-1" /> : 
                              <PlayIcon className="w-3 h-3 mr-1" />
                            }
                            {isPlaying === selectedVoice.voice_id ? 'Pause' : 'Preview'}
                          </div>
                        )}
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </Button>
                  </div>
                  
                  {/* Model Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Model Selection
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    
                    <div className="space-y-2"> 
                      <Select
                         options={[
                           { value: 'eleven_turbo_v2_5', label: 'Turbo v2.5 - Fast & Customizable' },
                           { value: 'eleven_v3', label: 'V3 - High Quality' }
                         ]}
                         defaultValue={selectedModel}
                         onChange={(value) => setSelectedModel(value as 'eleven_turbo_v2_5' | 'eleven_v3')}
                         placeholder="Select a model"
                         className="w-full"
                       />
                    </div>
                  </div>

                  {/* Voice Settings */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Voice Settings
                    </label>
                    
                    {/* Voice Settings Grid - 2 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-4">
                        {/* Stability - Available for both models */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                              Stability
                            </label>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {voiceSettings.stability.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={voiceSettings.stability}
                            onChange={(e) => setVoiceSettings(prev => ({
                              ...prev,
                              stability: parseFloat(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                        </div>

                        {/* Style - Only for turbo_v2_5 */}
                        {selectedModel === 'eleven_turbo_v2_5' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm text-gray-600 dark:text-gray-400">
                                Style
                              </label>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {voiceSettings.style.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={voiceSettings.style}
                              onChange={(e) => setVoiceSettings(prev => ({
                                ...prev,
                                style: parseFloat(e.target.value)
                              }))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                          </div>
                        )}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        {/* Speed - Only for turbo_v2_5 */}
                        {selectedModel === 'eleven_turbo_v2_5' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm text-gray-600 dark:text-gray-400">
                                Speed
                              </label>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {voiceSettings.speed.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.7"
                              max="1.2"
                              step="0.01"
                              value={voiceSettings.speed}
                              onChange={(e) => setVoiceSettings(prev => ({
                                ...prev,
                                speed: parseFloat(e.target.value)
                              }))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                          </div>
                        )}

                        {/* Similarity Boost - Only for turbo_v2_5 */}
                        {selectedModel === 'eleven_turbo_v2_5' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm text-gray-600 dark:text-gray-400">
                                Similarity Boost
                              </label>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {voiceSettings.similarity_boost.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={voiceSettings.similarity_boost}
                              onChange={(e) => setVoiceSettings(prev => ({
                                ...prev,
                                similarity_boost: parseFloat(e.target.value)
                              }))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Speaker Boost - Available for both models - Full width */}
                    <div className="flex items-center justify-between mt-4">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Speaker Boost
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={voiceSettings.use_speaker_boost}
                          onChange={(e) => setVoiceSettings(prev => ({
                            ...prev,
                            use_speaker_boost: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Text Content */}
                  <TextArea
                    label="Text Content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Enter the text you want to convert to speech..."
                    rows={6}
                    hint={`${formData.content.length}/${selectedModel === 'eleven_turbo_v2_5' ? 20000 : 3000} characters`}
                    className="w-full"
                  />
                  
                  {/* Generate Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      type="submit"
                      size="md"
                      disabled={isLoading || !formData.name.trim() || !formData.content.trim() || !selectedVoice}
                      className="px-8 py-4 min-w-[200px]"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        'Generate Speech'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar - Recent Audio Generates */}
            <div className="xl:col-span-1">
              <Card className="sticky top-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Audio
                  </h2> 
                </div>
                
                {!isAuthenticated || !user ? (
                  <div className="text-center py-8">
                    <div className="inline-flex p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                      <SpeakerIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Sign in to view your generation history
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setIsAuthModalOpen(true)}
                    >
                      Sign In
                    </Button>
                  </div>
                ) : userGenerates.length > 0 ? (
                  <div className="space-y-3  overflow-y-auto">
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
                          
                          {generate.status === 'completed' && (
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const audioBlob = await generateService.downloadGenerate(generate.id);
                                    const audioUrl = URL.createObjectURL(audioBlob);
                                    
                                    setAudioPlayer({
                                      isVisible: true,
                                      title: generate.name,
                                      audioUrl: audioUrl,
                                      generateId: generate.id
                                    });
                                  } catch (error) {
                                    console.error('Error loading audio:', error);
                                    showToast('Không thể tải audio', 'error');
                                  }
                                }}
                                startIcon={<PlayIcon className="w-3 h-3" />}
                                className="flex-1"
                              >
                                Play
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const audioBlob = await generateService.downloadGenerate(generate.id);
                                    const url = URL.createObjectURL(audioBlob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${generate.name}.mp3`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    showToast('Tải xuống thành công!', 'success');
                                  } catch (error) {
                                    console.error('Error downloading:', error);
                                    showToast('Lỗi khi tải xuống', 'error');
                                  }
                                }}
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
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                      <SpeakerIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No audio generations yet
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </form>

        {/* Toast Notification */}
        {toast.visible && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-yellow-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={closeToast}
                className="ml-4 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

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
                  Generation Request Submitted
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Project:</span> {lastGenerateResult.name}</p>
                  <p><span className="font-medium">Status:</span> 
                    <Badge variant="light" color="warning" size="sm" className="ml-2">
                      {lastGenerateResult.status}
                    </Badge>
                  </p>
                  <p><span className="font-medium">Credit Cost:</span> {lastGenerateResult.credit_cost}</p>
                  {lastGenerateResult.task_id && (
                    <p><span className="font-medium">Task ID:</span> {lastGenerateResult.task_id}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      
      <VoiceSelectionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSelectVoice={handleVoiceSelect}
        selectedVoiceId={selectedVoice?.voice_id}
        onVoicePreview={handleVoicePreview}
        playingVoiceId={isPlaying}
      />

      {/* Credit Modal */}
      <CreditModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        message={creditModalData.message}
        requiredCredits={creditModalData.requiredCredits}
        currentCredits={creditModalData.currentCredits}
        onBuyCredits={() => {
          setShowCreditModal(false);
          window.location.href = '/price';
        }}
      />

      {/* Audio Player */}
      {audioPlayer.isVisible && (
        <ModernAudioPlayer
          title={audioPlayer.title}
          audioUrl={audioPlayer.audioUrl}
          isVisible={audioPlayer.isVisible}
          onClose={() => {
            setAudioPlayer(prev => ({ ...prev, isVisible: false }));
            if (audioPlayer.audioUrl) {
              URL.revokeObjectURL(audioPlayer.audioUrl);
            }
          }}
        />
      )}
    </div>
  );
};

export default ElevenLabs;