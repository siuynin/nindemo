import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext'; 
import generateService from '../services/generateService';
import userCreditService from '../services/userCreditService';
import { SpeakerIcon, PlayIcon, PauseIcon, DownloadIcon, LoadingSpinner } from '../components/icons';
import AuthModal from '../components/AuthModal';
import CreditModal from '../components/CreditModal';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import MinimaxVoiceModal from '../components/MinimaxVoiceModal';
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

interface MinimaxVoice {
  voice_id: string;
  name: string;
  language: string;
  gender: string;
  description?: string;
}

const Minimax: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Set page title
  useEffect(() => {
    document.title = 'Minimax TTS - AI App';
  }, []);

  // Check for voice selection from VoiceClone page
  useEffect(() => {
    const selectedVoiceId = localStorage.getItem('selected_voice_id');
    const selectedVoiceName = localStorage.getItem('selected_voice_name');
    const selectedVoicePreview = localStorage.getItem('selected_voice_preview');
    
    if (selectedVoiceId && selectedVoiceName) {
      // Update voice settings with the selected voice
      setVoiceSettings(prev => ({
        ...prev,
        voice_id: selectedVoiceId
      }));
      setSelectedVoiceName(selectedVoiceName);
      
      // Optionally set the preview text as content
      if (selectedVoicePreview) {
        setFormData(prev => ({
          ...prev,
          content: selectedVoicePreview
        }));
      }
      
      // Clear the localStorage after using the values
      localStorage.removeItem('selected_voice_id');
      localStorage.removeItem('selected_voice_name');
      localStorage.removeItem('selected_voice_preview');
      
      showToast(`Voice "${selectedVoiceName}" selected from Voice Clone`, 'success');
    }
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    content: ''
  });
  
  // Character limit for Minimax
  const CHARACTER_LIMIT = 20000;
  
  // Model and voice settings state
  const [selectedModel, setSelectedModel] = useState<string>('speech-2.5-hd-preview');
  const [voiceSettings, setVoiceSettings] = useState({
    voice_id: '209533299589184',
    vol: 1,
    pitch: 0,
    speed: 1
  });
  const [languageBoost, setLanguageBoost] = useState<string>('Auto');
  const [userGenerates, setUserGenerates] = useState<Generate[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; visible: boolean }>({ message: '', type: 'success', visible: false });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('Default Voice');
  
  // Credit modal state
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditModalData, setCreditModalData] = useState<{
    message?: string;
    requiredCredits?: number;
    currentCredits?: number;
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

  // Auto-hide timeout state
  const [lastGenerateTimeout, setLastGenerateTimeout] = useState<NodeJS.Timeout | null>(null);

  // Textarea ref for SSML tag insertion
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // SSML breaktime tags
  const ssmlBreaktimeTags = [
    { label: '0.5s', value: '<#0.5#>' },
    { label: '1s', value: '<#1#>' },
    { label: '1.5s', value: '<#1.5#>' },
    { label: '2s', value: '<#2#>' },
    { label: '3s', value: '<#3#>' },
    { label: '5s', value: '<#5#>' }
  ];

  // Function to insert SSML tag at cursor position
  const insertSSMLTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentContent = formData.content;
    
    // Check if adding the tag would exceed character limit
    if (currentContent.length + tag.length > CHARACTER_LIMIT) {
      showToast('Không thể thêm tag vì sẽ vượt quá giới hạn ký tự', 'warning');
      return;
    }

    // Get current cursor position from the actual textarea element
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;

    // Create new content with tag inserted
    const newContent = currentContent.substring(0, start) + tag + currentContent.substring(end);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));

    // Use requestAnimationFrame to ensure DOM is updated before setting cursor
    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        const newCursorPos = start + tag.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  // Available models
  const availableModels = [
    { value: 'speech-2.5-turbo-preview', label: 'Speech 2.5 Turbo Preview - High Quality' },
    { value: 'speech-2.0-turbo', label: 'Speech 2.0 Turbo - Standard Quality' }
  ];

  // Available voices
  const availableVoices: MinimaxVoice[] = [
    { voice_id: '209533299589184', name: 'Default Voice', language: 'Auto', gender: 'Neutral', description: 'Standard voice for general use' },
    { voice_id: '209533299589185', name: 'Female Voice 1', language: 'Auto', gender: 'Female', description: 'Clear female voice' },
    { voice_id: '209533299589186', name: 'Male Voice 1', language: 'Auto', gender: 'Male', description: 'Clear male voice' }
  ];

  // Language boost options
  const languageBoostOptions = [
    { value: 'Auto', label: 'Auto Detect' },
    { value: 'Vietnamese', label: 'Vietnamese' },
    { value: 'English', label: 'English' },
    { value: 'Afrikaans', label: 'Afrikaans' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Armenian', label: 'Armenian' },
    { value: 'Assamese', label: 'Assamese' },
    { value: 'Azerbaijani', label: 'Azerbaijani' },
    { value: 'Belarusian', label: 'Belarusian' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Bosnian', label: 'Bosnian' },
    { value: 'Bulgarian', label: 'Bulgarian' },
    { value: 'Catalan', label: 'Catalan' },
    { value: 'Cebuano', label: 'Cebuano' },
    { value: 'Chichewa', label: 'Chichewa' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Croatian', label: 'Croatian' },
    { value: 'Czech', label: 'Czech' },
    { value: 'Danish', label: 'Danish' },
    { value: 'Dutch', label: 'Dutch' },
    { value: 'Estonian', label: 'Estonian' },
    { value: 'Filipino', label: 'Filipino' },
    { value: 'Finnish', label: 'Finnish' },
    { value: 'French', label: 'French' },
    { value: 'Galician', label: 'Galician' },
    { value: 'Georgian', label: 'Georgian' },
    { value: 'German', label: 'German' },
    { value: 'Greek', label: 'Greek' },
    { value: 'Gujarati', label: 'Gujarati' },
    { value: 'Hausa', label: 'Hausa' },
    { value: 'Hebrew', label: 'Hebrew' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Hungarian', label: 'Hungarian' },
    { value: 'Icelandic', label: 'Icelandic' },
    { value: 'Indonesian', label: 'Indonesian' }, 
    { value: 'Italian', label: 'Italian' },
    { value: 'Japanese', label: 'Japanese' }, 
    { value: 'Korean', label: 'Korean' },
    { value: 'Malay', label: 'Malay' },
    { value: 'Portuguese', label: 'Portuguese' }, 
    { value: 'Polish', label: 'Polish' },
    { value: 'Russian', label: 'Russian' },  
    { value: 'Romanian', label: 'Romanian' },
    { value: 'Spanish', label: 'Spanish' }, 
    { value: 'Swedish', label: 'Swedish' },
    { value: 'Thai', label: 'Thai' },
    { value: 'Turkish', label: 'Turkish' },
    { value: 'Ukrainian', label: 'Ukrainian' },
    { value: 'Urdu', label: 'Urdu' },
    
  ];

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Giới hạn ký tự cho content
    if (name === 'content' && value.length > CHARACTER_LIMIT) {
      return;
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

  // Auto-hide last generate result after 10 seconds
  useEffect(() => {
    if (lastGenerateResult && lastGenerateResult.id) {
      // Clear any existing timeout
      if (lastGenerateTimeout) {
        clearTimeout(lastGenerateTimeout);
        setLastGenerateTimeout(null);
      }
      
      // Set new timeout to hide the latest task after 10 seconds
      const timeout = setTimeout(() => {
        setLastGenerateResult(null);
        setLastGenerateTimeout(null);
      }, 10000);
      
      setLastGenerateTimeout(timeout);
      
      // Cleanup function
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [lastGenerateResult]);

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
    
    if (!formData.name.trim() || !formData.content.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }

    setIsLoading(true);
    
    try {
      // Estimate credit cost based on content length (approximate)
      const contentLength = formData.content.trim().length;
      const estimatedCost = Math.ceil(contentLength / 100); // Rough estimate: 1 credit per 100 characters
      
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

      // Create generates record with status 'pending'
      const generateResponse = await generateService.createGenerate({
        name: formData.name.trim(),
        content: formData.content.trim(),
        type: 'audio',
        status: 'pending',
        provider: 'minimax',
        model: selectedModel,
        voice_settings: voiceSettings,
        language_boost: languageBoost,
        with_transcript: false
      });
      
      if (!generateResponse.success || !generateResponse.data.id) {
        throw new Error('Failed to create generate record');
      }

      // Store the generate result to display to user
      setLastGenerateResult({
        id: generateResponse.data.id,
        name: generateResponse.data.name,
        status: generateResponse.data.status,
        credit_cost: generateResponse.data.credit_cost,
        task_id: generateResponse.data.task_id
      });
      
      showToast(`Yêu cầu tạo audio đã được gửi thành công! Task ID: ${generateResponse.data.task_id || 'N/A'}`, 'success');
      
      // Keep form values after successful submission - don't reset
      // setFormData({ name: '', content: '' });
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

  // Handle audio playback
  const handlePlayAudio = (generate: Generate) => {
    if (generate.result_url) {
      setAudioPlayer({
        isVisible: true,
        title: generate.name,
        audioUrl: generate.result_url,
        generateId: generate.id
      });
    } else {
      showToast('Audio chưa sẵn sàng hoặc không tồn tại', 'warning');
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
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <SpeakerIcon className="w-8 h-8" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Minimax TTS
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Advanced AI text-to-speech with natural voice synthesis and multilingual support
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

                  {/* Model Selection and Language Boost - 2 Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Model Selection */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Model Selection
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      
                      <Select
                        options={availableModels}
                        defaultValue={selectedModel}
                        onChange={(value) => setSelectedModel(value)}
                        placeholder="Select a model"
                        className="w-full"
                      />
                    </div>
                    
                    {/* Language Boost */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Language Boost
                      </label>
                      
                      <Select
                        options={languageBoostOptions}
                        defaultValue={languageBoost}
                        onChange={(value) => setLanguageBoost(value)}
                        placeholder="Select language boost"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Voice Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Voice Selection
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    
                    <Button
                      variant="outline"
                      onClick={() => setIsVoiceModalOpen(true)}
                      className="w-full justify-between"
                    >
                      <span>{selectedVoiceName}</span>
                      <SpeakerIcon className="w-4 h-4" />
                    </Button>
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
                        {/* Volume */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                              Volume
                            </label>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {voiceSettings.vol.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={voiceSettings.vol}
                            onChange={(e) => setVoiceSettings(prev => ({
                              ...prev,
                              vol: parseFloat(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                        </div>

                        {/* Speed */}
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
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={voiceSettings.speed}
                            onChange={(e) => setVoiceSettings(prev => ({
                              ...prev,
                              speed: parseFloat(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        {/* Pitch */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                              Pitch
                            </label>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {voiceSettings.pitch.toFixed(1)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-10"
                            max="10"
                            step="1"
                            value={voiceSettings.pitch}
                            onChange={(e) => setVoiceSettings(prev => ({
                              ...prev,
                              pitch: parseInt(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SSML Breaktime Tags */}
                  <div className="space-y-3">
                    
                    <div className="flex flex-wrap gap-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      SSML Breaktime Tags
                      </label>
                      {ssmlBreaktimeTags.map((tag) => (
                        <button
                          key={tag.value}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => insertSSMLTag(tag.value)}
                          className="px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Click on a tag to insert it at your cursor position in the text content below.
                    </p>
                  </div>

                  {/* Text Content */}
                  <TextArea
                    ref={textareaRef}
                    label="Text Content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Enter the text you want to convert to speech..."
                    rows={6}
                    hint={`${formData.content.length}/${CHARACTER_LIMIT} characters`}
                    className="w-full"
                    required
                  />
                  

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !formData.name.trim() || !formData.content.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner className="w-5 h-5" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <SpeakerIcon className="w-5 h-5" />
                        <span>Generate Audio</span>
                      </div>
                    )}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Sidebar - Recent Generations */}
            <div className="xl:col-span-1">
              <Card className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Generations
                  </h3>
                </div>

                {/* Last Generate Result */}
                {lastGenerateResult && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                          {lastGenerateResult.name}
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          Status: {lastGenerateResult.status}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Cost: {lastGenerateResult.credit_cost} credits
                        </p>
                        {lastGenerateResult.task_id && (
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Task ID: {lastGenerateResult.task_id}
                          </p>
                        )}
                      </div>
                      <Badge variant="info" size="sm">
                        Latest
                      </Badge>
                    </div>
                  </div>
                )}

                {/* User Generates List */}
                {!isAuthenticated ? (
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
                              {generate.status === 'processing' ? 'Đang xử lý' :
                               generate.status === 'completed' ? 'Hoàn thành' :
                               generate.status === 'failed' ? 'Thất bại' :
                               generate.status === 'pending' ? 'Chờ xử lý' : generate.status}
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
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-yellow-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">{toast.message}</span>
              <button
                onClick={closeToast}
                className="ml-2 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        {isAuthModalOpen && (
          <AuthModal onClose={() => setIsAuthModalOpen(false)} />
        )}

        {/* Voice Selection Modal */}
        <MinimaxVoiceModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onSelectVoice={(voiceId, voiceName) => {
            setVoiceSettings(prev => ({ ...prev, voice_id: voiceId }));
            setSelectedVoiceName(voiceName);
          }}
          selectedVoiceId={voiceSettings.voice_id}
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
            onClose={() => setAudioPlayer(prev => ({ ...prev, isVisible: false }))}
            generateId={audioPlayer.generateId}
            autoPlay={true}
          />
        )}
      </div>
    </div>
  );
};

export default Minimax;