import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LoadingSpinner } from '../components/icons'; 
import generateService from '../services/generateService';
import { SpeakerIcon, PlayIcon, PauseIcon, DownloadIcon } from '../components/icons';
import AuthModal from '../components/AuthModal';
import VoiceSelectionModal from '../components/VoiceSelectionModal';
import { ElevenLabsVoice } from '../types';
import { Card, Button, Badge, Input, TextArea } from '../components/ui';

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
  
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [userGenerates, setUserGenerates] = useState<Generate[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
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

  // Handle voice selection
  const handleVoiceSelect = (voice: ElevenLabsVoice) => {
    setSelectedVoice(voice);
    setIsVoiceModalOpen(false);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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

  // Handle voice preview
  const handleVoicePreview = (voiceId: string) => {
    if (isPlaying === voiceId) {
      setIsPlaying(null);
      // Stop audio playback
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    } else {
      setIsPlaying(voiceId);
      // Find preview URL for this voice
      let previewUrl = '';
      if (selectedVoice && selectedVoice.voice_id === voiceId) {
        previewUrl = selectedVoice.preview_url;
      }
      
      if (previewUrl) {
        const audio = new Audio(previewUrl);
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          showToast('Không thể phát audio preview', 'error');
        });
        
        audio.onended = () => setIsPlaying(null);
        audio.onerror = () => {
          setIsPlaying(null);
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
      // First, create generates record with status 'pending'
      const generateResponse = await generateService.createGenerate({
        name: formData.name.trim(),
        content: formData.content.trim(),
        type: 'audio',
        status: 'pending',
        voice_id: selectedVoice.voice_id
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
      showToast('Có lỗi xảy ra khi gửi yêu cầu: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
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
                    
                    {/* Selected Voice Display */}
                    {selectedVoice ? (
                      <Card padding="sm" className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {selectedVoice.name}
                              </h4>
                              <Badge variant="solid" color="primary" size="sm">
                                Selected
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {Array.isArray(selectedVoice.language) 
                                ? selectedVoice.language.map(lang => 
                                    typeof lang === 'object' && lang.language ? lang.language : lang
                                  ).join(', ').toUpperCase()
                                : (typeof selectedVoice.language === 'string' ? selectedVoice.language.toUpperCase() : 'N/A')
                              } • {selectedVoice.gender} • {selectedVoice.age}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                              {selectedVoice.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVoicePreview(selectedVoice.voice_id)}
                              startIcon={isPlaying === selectedVoice.voice_id ? 
                                <PauseIcon className="w-4 h-4" /> : 
                                <PlayIcon className="w-4 h-4" />
                              }
                            >
                              {isPlaying === selectedVoice.voice_id ? 'Pause' : 'Preview'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card padding="sm" className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="text-center py-4">
                          <SpeakerIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No voice selected
                          </p>
                        </div>
                      </Card>
                    )}
                    
                    {/* Voice Selection Button */}
                    <Button
                      variant="outline"
                      onClick={() => setIsVoiceModalOpen(true)}
                      startIcon={<SpeakerIcon className="w-5 h-5" />}
                      className="w-full"
                    >
                      {selectedVoice ? 'Change Voice' : 'Select Voice'}
                    </Button>
                  </div>
                  
                  {/* Text Content */}
                  <TextArea
                    label="Text Content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Enter the text you want to convert to speech..."
                    rows={6}
                    hint={`${formData.content.length} characters`}
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
                  <div className="space-y-3 max-h-96 overflow-y-auto">
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
                                    const audio = new Audio(audioUrl);
                                    
                                    audio.onended = () => {
                                      URL.revokeObjectURL(audioUrl);
                                    };
                                    
                                    audio.play().catch(error => {
                                      console.error('Error playing audio:', error);
                                      showToast('Không thể phát audio', 'error');
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
      />
    </div>
  );
};

export default ElevenLabs;