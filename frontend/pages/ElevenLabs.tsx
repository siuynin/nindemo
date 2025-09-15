import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LoadingSpinner } from '../components/icons'; 
import generateService from '../services/generateService';
import { SpeakerIcon, PlayIcon, PauseIcon, DownloadIcon } from '../components/icons';
import AuthModal from '../components/AuthModal';
import VoiceSelectionModal from '../components/VoiceSelectionModal';
import { ElevenLabsVoice } from '../types';

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
  
  // Set page title
  useEffect(() => {
    document.title = 'ElevenLabs - AI App';
  }, []);

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
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="inline-flex p-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white mr-4">
              <SpeakerIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">ElevenLabs</h1>
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                High-quality AI voice generation
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Project Information */}
              <div className={`p-6 rounded-xl ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <h2 className="text-xl font-semibold mb-4">Project Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Project Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter project name..."
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      required
                    />
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Select Voice *
                    </label>
                    
                    {/* Selected Voice Display */}
                    {selectedVoice ? (
                      <div className={`p-4 rounded-lg border mb-2 ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{selectedVoice.name}</h4>
                            <p className={`text-xs ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {Array.isArray(selectedVoice.language) 
                                ? selectedVoice.language.map(lang => 
                                    typeof lang === 'object' && lang.language ? lang.language : lang
                                  ).join(', ').toUpperCase()
                                : (typeof selectedVoice.language === 'string' ? selectedVoice.language.toUpperCase() : 'N/A')
                              } • {selectedVoice.gender} • {selectedVoice.age}
                            </p>
                            <p className={`text-xs mt-1 ${
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {selectedVoice.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleVoicePreview(selectedVoice.voice_id)}
                              className={`p-2 rounded-full transition-colors ${
                                theme === 'dark'
                                  ? 'hover:bg-gray-600 text-gray-300'
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}
                            >
                              {isPlaying === selectedVoice.voice_id ? (
                                <PauseIcon className="w-4 h-4" />
                              ) : (
                                <PlayIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-lg border mb-2 text-center ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}>
                        <p className="text-sm">Chưa chọn voice nào</p>
                      </div>
                    )}
                    
                    {/* Voice Selection Button */}
                    <button
                      type="button"
                      onClick={() => setIsVoiceModalOpen(true)}
                      className={`w-full p-3 rounded-lg border-2 border-dashed transition-colors ${
                        theme === 'dark'
                          ? 'border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <SpeakerIcon className="w-5 h-5" />
                        <span>{selectedVoice ? 'Thay đổi Voice' : 'Chọn Voice'}</span>
                      </div>
                    </button>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Text Content *
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Enter the text you want to convert to speech..."
                      rows={6}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      required
                    />
                    <p className={`text-sm mt-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {formData.content.length} characters
                    </p>
                  </div>
                  
                  {/* Generate Button */}
                  <div className="flex justify-center mt-6">
                    <button
                      type="submit"
                      disabled={isLoading || !formData.name.trim() || !formData.content.trim() || !selectedVoice}
                      className={`px-8 py-4 rounded-lg font-semibold text-white transition-all ${
                        isLoading || !formData.name.trim() || !formData.content.trim() || !selectedVoice
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        'Generate Speech'
                      )}
                    </button>
                  </div>
                </div>
              </div>


            </div>

            {/* Right Column - Recent Audio Generates */}
            <div className={`p-6 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h2 className="text-xl font-semibold mb-4">Recent Audio Generates</h2>
              
              {!isAuthenticated || !user ? (
                <div className={`p-8 text-center ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <SpeakerIcon className={`w-12 h-12 mx-auto mb-3 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                  }`} />
                  <p className="text-sm">Vui lòng đăng nhập để xem lịch sử</p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Đăng nhập
                  </button>
                </div>
              ) : userGenerates.length > 0 ? (
                <div className="space-y-3">
                  {userGenerates.map((generate) => (
                    <div key={generate.id} className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1 truncate">{generate.name}</h4>
                          <p className={`text-xs mb-2 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {new Date(generate.created_at).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            generate.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            generate.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            generate.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {generate.status === 'processing' ? 'Đang xử lý' :
                             generate.status === 'completed' ? 'Hoàn thành' :
                             generate.status === 'failed' ? 'Thất bại' :
                             generate.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          {generate.status === 'completed' && (
                            <>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    // Use blob URL for better compatibility and authentication
                                    const audioBlob = await generateService.downloadGenerate(generate.id);
                                    const audioUrl = URL.createObjectURL(audioBlob);
                                    const audio = new Audio(audioUrl);
                                    
                                    audio.onended = () => {
                                      URL.revokeObjectURL(audioUrl); // Clean up blob URL
                                    };
                                    
                                    await audio.play();
                                  } catch (error) {
                                    console.error('Error playing audio:', error);
                                    showToast('Không thể phát audio', 'error');
                                  }
                                }}
                                className={`p-2 rounded-full transition-colors ${
                                  theme === 'dark'
                                    ? 'hover:bg-gray-600 text-gray-300'
                                    : 'hover:bg-gray-200 text-gray-600'
                                }`}
                                title="Play audio"
                              >
                                <PlayIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
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
                                  } catch (error) {
                                    console.error('Error downloading audio:', error);
                                    showToast('Không thể tải xuống audio', 'error');
                                  }
                                }}
                                className={`p-2 rounded-full transition-colors ${
                                  theme === 'dark'
                                    ? 'hover:bg-gray-600 text-gray-300'
                                    : 'hover:bg-gray-200 text-gray-600'
                                }`}
                                title="Download audio"
                              >
                                <DownloadIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-8 text-center ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <SpeakerIcon className={`w-12 h-12 mx-auto mb-3 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                  }`} />
                  <p className="text-sm">Chưa có audio generates nào</p>
                  <p className="text-xs mt-1">Tạo audio đầu tiên của bạn!</p>
                </div>
              )}
            </div>
          </div>

          {/* Generate Result Display */}
          {lastGenerateResult && (
            <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}>
              <h3 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">✅ Yêu cầu đã được tạo thành công!</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tên dự án:</label>
                  <p className={`text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{lastGenerateResult.name}</p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Trạng thái:</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    lastGenerateResult.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    lastGenerateResult.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    lastGenerateResult.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {lastGenerateResult.status === 'processing' ? 'Đang xử lý' :
                     lastGenerateResult.status === 'completed' ? 'Hoàn thành' :
                     lastGenerateResult.status === 'failed' ? 'Thất bại' :
                     lastGenerateResult.status}
                  </span>
                </div>
                <div>
                   <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Chi phí Credits:</label>
                   <p className={`text-base font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{typeof lastGenerateResult.credit_cost === 'number' ? lastGenerateResult.credit_cost.toFixed(2) : '0.00'}</p>
                 </div>
                {lastGenerateResult.task_id && (
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Task ID:</label>
                    <p className={`text-sm font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{lastGenerateResult.task_id}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setLastGenerateResult(null)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-yellow-500 text-black'
        }`}>
          <div className="flex items-center justify-between">
            <span>{toast.message}</span>
            <button
              onClick={closeToast}
              className="ml-4 text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      
      {/* Voice Selection Modal */}
      <VoiceSelectionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSelectVoice={handleVoiceSelect}
        selectedVoiceId={selectedVoice?.voice_id}
      />
    </div>
  );
};

export default ElevenLabs;