import React, { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import AuthModal from '../components/AuthModal';

interface VideoGeneration {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  aspectRatio: string;
  duration: number;
  type: 'text-to-video' | 'image-to-video';
  inputImageUrl?: string;
}

const VideoGeneration: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [generations, setGenerations] = useState<VideoGeneration[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aspect ratio options with 720p max resolution
  const aspectRatioOptions = [
    { value: '16:9', label: '16:9 (1280x720)' },
    { value: '9:16', label: '9:16 (720x1280)' },
    { value: '1:1', label: '1:1 (720x720)' }
  ];

  const durationOptions = [
    { value: '10', label: '10 giây' }, 
    { value: '15', label: '15 giây' }
  ];

  // Get resolution based on aspect ratio
  const getResolution = (ratio: string) => {
    switch (ratio) {
      case '16:9':
        return { width: 1280, height: 720 };
      case '9:16':
        return { width: 720, height: 1280 };
      case '1:1':
        return { width: 720, height: 720 };
      default:
        return { width: 1280, height: 720 };
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setAlert({ type: 'error', message: 'Kích thước ảnh phải nhỏ hơn 10MB' });
        return;
      }
      
      setInputImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setInputImage(null);
    setInputImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!prompt.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng nhập prompt' });
      return;
    }

    if (activeTab === 'image-to-video' && !inputImage) {
      setAlert({ type: 'error', message: 'Vui lòng tải lên ảnh đầu vào' });
      return;
    }

    setIsGenerating(true);
    setAlert(null);

    try {
      // Check authentication
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setShowAuthModal(true);
        return;
      }

      const resolution = getResolution(aspectRatio);
      const formData = new FormData();
      
      formData.append('positivePrompt', prompt);
      formData.append('duration', duration.toString());
      
      // Map aspect ratio to model
      let model = 'portrait';
      if (aspectRatio === '16:9') {
        model = 'landscape';
      } else if (aspectRatio === '9:16') {
        model = 'portrait';
      } else if (aspectRatio === '1:1') {
        model = 'portrait'; // Use portrait for square videos
      }
      
      formData.append('model', model);
      
      if (activeTab === 'image-to-video' && inputImage) {
        formData.append('inputImage', inputImage);
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/video/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          setShowAuthModal(true);
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        throw new Error(data.message || 'Không thể tạo video');
      }

      setAlert({ type: 'success', message: 'Video đang được tạo! Kiểm tra kết quả bên dưới.' });
      
      // Add to generations list
      const newGeneration: VideoGeneration = {
        id: data.id,
        prompt,
        status: 'processing',
        createdAt: new Date().toISOString(),
        aspectRatio,
        duration,
        type: activeTab,
        inputImageUrl: inputImagePreview || undefined,
      };
      
      setGenerations(prev => [newGeneration, ...prev]);
      
      // Reset form
      setPrompt('');
      removeImage();
      
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Không thể tạo video' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tạo Video AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tạo video tuyệt vời từ văn bản hoặc hình ảnh bằng AI
          </p>
        </div>

        {alert && (
          <div className="mb-6">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('text-to-video')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'text-to-video'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Text to Video
                </button>
                <button
                  onClick={() => setActiveTab('image-to-video')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'image-to-video'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Image to Video
                </button>
              </div>

              {/* Prompt Input */}
              <div className="mb-6">
                <TextArea
                  label="Prompt"
                  placeholder="Mô tả video bạn muốn tạo..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Image Upload for Image-to-Video */}
              {activeTab === 'image-to-video' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ảnh đầu vào
                  </label>
                  
                  {!inputImagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      <div className="text-gray-500 dark:text-gray-400">
                        <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-sm">Nhấp để tải lên ảnh</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG tối đa 10MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={inputImagePreview}
                        alt="Xem trước ảnh"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Video Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Select
                    label="Tỷ lệ khung hình"
                    options={aspectRatioOptions}
                    defaultValue={aspectRatio}
                    onChange={setAspectRatio}
                  />
                </div>
                
                <div>
                  <Select
                    label="Thời lượng"
                    options={durationOptions}
                    defaultValue={duration.toString()}
                    onChange={(value) => setDuration(parseInt(value))}
                  />
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? 'Đang tạo video...' : 'Tạo Video'}
              </Button>
            </Card>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Video của bạn
              </h3>
              
              {generations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Chưa có video nào được tạo
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generations.map((generation) => (
                    <div key={generation.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {generation.type.replace('-', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          generation.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          generation.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          generation.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {generation.status === 'completed' ? 'Hoàn thành' :
                           generation.status === 'processing' ? 'Đang xử lý' :
                           generation.status === 'failed' ? 'Thất bại' : 'Chờ xử lý'}
                        </span>
                      </div>
                      
                      {generation.inputImageUrl && (
                        <img
                          src={generation.inputImageUrl}
                          alt="Ảnh đầu vào"
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                        {generation.prompt}
                      </p>
                      
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{generation.aspectRatio}</span>
                        <span>{generation.duration}s</span>
                      </div>
                      
                      {generation.videoUrl && (
                        <video
                          src={generation.videoUrl}
                          controls
                          className="w-full mt-2 rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};

export default VideoGeneration;