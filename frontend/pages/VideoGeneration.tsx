import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea'; 
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert'; 
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
  seed?: number | null;
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
  const [selectedModel, setSelectedModel] = useState('sora-2');
  const [addAudio, setAddAudio] = useState(false);
  const [audioPrompt, setAudioPrompt] = useState('');
  const [seed, setSeed] = useState<number | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [generations, setGenerations] = useState<VideoGeneration[]>([]);
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Video models with their specifications
  const videoModels = [
    { 
      value: 'sora-2', 
      label: 'Sora 2 (1080p, 10-10s)', 
      minDuration: 10,
      audio: true,
      maxDuration: 10, 
      resolution: '1080p',
      description: 'High quality video generation'
    },
    { 
      value: 'kling_25', 
      label: 'Kling 2.5 (1080p, 5-10s)', 
      minDuration: 5, 
      maxDuration: 10, 
      audio: false,
      resolution: '1080p',
      description: 'Advanced motion understanding'
    },
    { 
      value: 'wan-25', 
      label: 'Wan 2.5 (1080p, 1-30s)', 
      minDuration: 1, 
      maxDuration: 30, 
      resolution: '1080p',
      audio: true,  
      description: 'Flexible duration, up to 30 seconds'
    },
    { 
      value: 'nanobanana-video', 
      label: 'Nano Banana (720p, 5-10s)', 
      minDuration: 5, 
      maxDuration: 10, 
      audio: false,
      resolution: '720p',
      description: 'Fast processing, lower resolution'
    },
    { 
      value: 'pixverse', 
      label: 'Pixverse V5 (1080p, 5-8s)', 
      minDuration: 5, 
      maxDuration: 8, 
      audio: false,
      resolution: '1080p',
      description: 'Creative video generation'
    },
    { 
      value: 'seedance', 
      label: 'Seedance (1080p, 5-10s)', 
      minDuration: 5, 
      maxDuration: 10, 
      audio: false,
      resolution: '1080p',
      description: 'Dance and motion focused'
    },
    
  ];

  // Aspect ratio options with 720p max resolution
  const aspectRatioOptions = [
    { value: '16:9', label: '16:9 Landscape' },
    { value: '9:16', label: '9:16 Portrait' },
    { value: '1:1', label: '1:1 Square' }
  ];

  // Get duration options based on selected model
  const getDurationOptions = () => {
    const selectedModelData = videoModels.find(model => model.value === selectedModel);
    if (!selectedModelData) return [];

    const options = [];
    const { minDuration, maxDuration } = selectedModelData;
    
    // Generate duration options in 1-second increments
    for (let i = minDuration; i <= maxDuration; i++) {
      options.push({
        value: i.toString(),
        label: `${i} giây`
      });
    }
    
    return options;
  };

  // Handle model selection change
  const handleModelChange = (modelValue: string) => {
    setSelectedModel(modelValue);
    const selectedModelData = videoModels.find(model => model.value === modelValue);
    if (selectedModelData) {
      // Reset duration to model's minimum if current duration is out of range
      if (duration < selectedModelData.minDuration || duration > selectedModelData.maxDuration) {
        setDuration(selectedModelData.minDuration);
      }
    }
  };

  // Get resolution based on aspect ratio


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

  // Poll video status for a specific generation
  const pollVideoStatus = async (generationId: string, taskId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/video/generation-status/${generationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          setShowAuthModal(true);
        }
        return;
      }

      const data = await response.json();
      console.log(`Individual poll: Updating generation ${generationId} status: ${data.status}, videoUrl: ${data.result_url || data.videoUrl}`);
      
      setGenerations(prev => {
        const updated = prev.map(gen => {
          if (gen.id === generationId) {
            const updatedGen = {
              ...gen,
              status: data.status,
              videoUrl: data.result_url || data.videoUrl || gen.videoUrl,
            };
            console.log(`Generation ${generationId} updated from ${gen.status} to ${data.status}`);
            return updatedGen;
          }
          return gen;
        });
        return updated;
      });

      // Stop polling if completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        const interval = pollingIntervals.get(generationId);
        if (interval) {
          clearInterval(interval);
          setPollingIntervals(prev => {
            const newMap = new Map(prev);
            newMap.delete(generationId);
            return newMap;
          });
          console.log(`Stopped individual polling for generation ${generationId}`);
        }

        // Show success/error message
        if (data.status === 'completed') {
          setAlert({ type: 'success', message: 'Video đã được tạo thành công!' });
        } else if (data.status === 'failed') {
          setAlert({ type: 'error', message: data.error_message || 'Tạo video thất bại' });
        }
      }
    } catch (error) {
      console.error(`Error polling video status for ${generationId}:`, error);
      // Continue polling even on error, but log it
      // Don't stop polling on network errors - video might still be processing
    }
  };

  // Start polling for a generation
  const startPolling = (generationId: string, taskId: string) => {
    // Don't start if already polling
    if (pollingIntervals.has(generationId)) return;

    // Poll immediately to get initial status
    pollVideoStatus(generationId, taskId);

    const interval = setInterval(() => {
      pollVideoStatus(generationId, taskId);
    }, 3000); // Poll every 3 seconds for faster updates

    setPollingIntervals(prev => new Map(prev.set(generationId, interval)));
  };

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.forEach(interval => clearInterval(interval));
    };
  }, []);

  // Load existing generations when component mounts or user logs in
  const loadExistingGenerations = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/video/generations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          setShowAuthModal(true);
        }
        return;
      }

      const data = await response.json();
      
      // Debug log to check raw data from backend
      console.log('Raw data from backend:', data);
      
      // Transform backend data to match frontend interface
      const transformedGenerations: VideoGeneration[] = data.data.map((gen: any) => {
        // Backend now returns transformed data with prompt already parsed
 
        return {
          id: gen.id.toString(),
          prompt: gen.prompt || '',
          status: gen.status,
          videoUrl: gen.result_url,
          createdAt: gen.created_at,
          aspectRatio: gen.settings?.model === 'landscape' ? '16:9' : gen.settings?.model === 'portrait' ? '9:16' : '1:1',
          duration: gen.settings?.duration || 10,
          type: gen.input_image_url ? 'image-to-video' : 'text-to-video',
          inputImageUrl: gen.input_image_url,
          seed: gen.settings?.seed || null,
        };
      });

      setGenerations(transformedGenerations);

      // Start polling for any processing videos
      transformedGenerations.forEach(gen => {
        if (gen.status === 'processing' && gen.id) {
          startPolling(gen.id, ''); // taskId not needed for existing generations
        }
      });

    } catch (error) {
      console.error('Error loading existing generations:', error);
    }
  };

  // Auto-refresh function to check video processing status every 10 seconds (reduced frequency)
  const checkVideoProcessingStatus = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Only check videos that are NOT being individually polled to avoid conflicts
      const unpolledProcessingVideos = generations.filter(gen => 
        (gen.status === 'processing' || gen.status === 'pending') && 
        !pollingIntervals.has(gen.id)
      );

      if (unpolledProcessingVideos.length === 0) {
        console.log('No videos need batch status check (all are individually polled)');
        return;
      }

      console.log(`Checking batch status for ${unpolledProcessingVideos.length} unpolled videos`);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/video/check-processing-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          video_ids: unpolledProcessingVideos.map(v => v.id) 
        })
      });

      if (!response.ok) {
        console.error('Batch check failed:', response.status, response.statusText);
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          setShowAuthModal(true);
        }
        return;
      }

      const data = await response.json();
      console.log('Batch check response:', data);
      
      if (data.success && data.updated_videos && data.updated_videos.length > 0) {
        console.log(`Batch update received for ${data.updated_videos.length} videos`);
        
        // Update generations with new status - only for videos not being individually polled
        setGenerations(prev => {
          const updated = prev.map(gen => {
            const updatedVideo = data.updated_videos.find((video: any) => video.id.toString() === gen.id);
            if (updatedVideo && !pollingIntervals.has(gen.id)) {
              console.log(`Batch check: Updating video ${gen.id} from ${gen.status} to ${updatedVideo.status}`);
              return {
                ...gen,
                status: updatedVideo.status,
                videoUrl: updatedVideo.result_url || gen.videoUrl,
              };
            }
            return gen;
          });
          return updated;
        });

        // Show notifications for completed videos
        data.updated_videos.forEach((video: any) => {
          if (video.status === 'completed') {
            setAlert({ type: 'success', message: `Video "${video.prompt?.substring(0, 30)}..." đã được tạo thành công!` });
          } else if (video.status === 'failed') {
            setAlert({ type: 'error', message: `Video "${video.prompt?.substring(0, 30)}..." tạo thất bại: ${video.error_message || 'Lỗi không xác định'}` });
          }
        });
      } else {
        console.log('Batch check: No updated videos');
      }

    } catch (error) {
      console.error('Error in batch status check:', error);
    }
  };

  // Load existing generations when component mounts or user authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadExistingGenerations();
    } else {
      setGenerations([]); // Clear generations when user logs out
    }
  }, [isAuthenticated]);

  // Auto-refresh effect to check video processing status every 10 seconds when user is on screen
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval if user is not authenticated
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
      return;
    }

    // Only start auto-refresh if we have processing videos that are NOT being individually polled
    const hasUnpolledProcessingVideos = generations.some(gen => 
      (gen.status === 'processing' || gen.status === 'pending') && 
      !pollingIntervals.has(gen.id)
    );
    
    if (hasUnpolledProcessingVideos && !autoRefreshIntervalRef.current) {
      console.log('Starting batch auto-refresh for unpolled processing videos');
      // Set up interval to check every 10 seconds (reduced frequency to avoid conflicts)
      autoRefreshIntervalRef.current = setInterval(() => {
        console.log('Batch auto-refresh interval triggered');
        checkVideoProcessingStatus();
      }, 10000);
    } else if (!hasUnpolledProcessingVideos && autoRefreshIntervalRef.current) {
      console.log('No unpolled processing videos, stopping batch auto-refresh');
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  }, [isAuthenticated, generations, pollingIntervals]); // Add pollingIntervals as dependency

  // Comprehensive cleanup effect for component unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up all intervals...');
      
      // Clear auto-refresh interval
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
      
      // Clear all individual polling intervals
      pollingIntervals.forEach((intervalId, videoId) => {
        console.log(`Cleaning up polling interval for video ${videoId}`);
        clearInterval(intervalId);
      });
      
      // Clear polling intervals Map
      pollingIntervals.clear();
    };
  }, []); // Only run on mount/unmount

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

      const formData = new FormData();
      
      formData.append('positivePrompt', prompt);
      formData.append('duration', duration.toString());
      formData.append('videoModel', selectedModel); // Add selected video model
      
      // Get resolution based on aspect ratio
      const resolution = aspectRatio === '1:1' ? '720p' : '1080p';
      formData.append('resolution', resolution);
      
      // Add audio fields if audio is enabled
      if (addAudio) {
        formData.append('add_audio', 'true');
        formData.append('audio_prompt', audioPrompt);
      } else {
        formData.append('add_audio', 'false');
      }
      
      // Send aspect ratio directly (16:9 or 9:16)
      formData.append('aspect_ratio', aspectRatio);
      
      // Add seed if provided
      if (seed !== '') {
        formData.append('seed', seed.toString());
      }
      
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

      // Normalize ids and task keys from backend response
      const genId = (data?.data?.id ?? '').toString();
      const returnedTaskId = data?.data?.task_id || data?.data?.taskId || data?.data?.generation_id;

      // Add to generations list
      const newGeneration: VideoGeneration = {
        id: genId,
        prompt,
        status: 'processing',
        createdAt: new Date().toISOString(),
        aspectRatio,
        duration,
        type: activeTab,
        inputImageUrl: inputImagePreview || undefined,
      };
      
      setGenerations(prev => [newGeneration, ...prev]);
      
      // Start polling for this generation using correct task key
      if (returnedTaskId) {
        startPolling(genId, returnedTaskId);
      }
      
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
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
                  {/* Warning note for Sora 2 model */}
                  {selectedModel === 'sora-2' && (
                    <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                            Lưu ý về Sora 2
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            Sora 2 hiện tại không hỗ trợ tạo video từ ảnh có hình người thật. Vui lòng sử dụng ảnh phong cảnh, vật thể hoặc chọn model khác.
                          </p>
                        </div>
                      </div>
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
              <div className="mb-6">
                <Select
                  label="Model AI"
                  options={videoModels}
                  defaultValue={selectedModel}
                  onChange={handleModelChange}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {videoModels.find(model => model.value === selectedModel)?.description}
                </p>
              </div>

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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thời lượng: {duration} giây
                  </label>
                  <input
                    type="range"
                    min={videoModels.find(model => model.value === selectedModel)?.minDuration || 1}
                    max={videoModels.find(model => model.value === selectedModel)?.maxDuration || 30}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((duration - (videoModels.find(model => model.value === selectedModel)?.minDuration || 1)) / ((videoModels.find(model => model.value === selectedModel)?.maxDuration || 30) - (videoModels.find(model => model.value === selectedModel)?.minDuration || 1))) * 100}%, #d1d5db ${((duration - (videoModels.find(model => model.value === selectedModel)?.minDuration || 1)) / ((videoModels.find(model => model.value === selectedModel)?.maxDuration || 30) - (videoModels.find(model => model.value === selectedModel)?.minDuration || 1))) * 100}%, #d1d5db 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{videoModels.find(model => model.value === selectedModel)?.minDuration || 1}s</span>
                    <span>{videoModels.find(model => model.value === selectedModel)?.maxDuration || 30}s</span>
                  </div>
                </div>
              </div>

              {/* Audio Settings - Only show if selected model has audio: false */}
              {videoModels.find(model => model.value === selectedModel)?.audio === false && (
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="addAudio"
                      checked={addAudio}
                      onChange={(e) => setAddAudio(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="addAudio" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Thêm âm thanh
                    </label>
                  </div>
                  
                  {addAudio && (
                    <div>
                      <TextArea
                        label="Mô tả âm thanh"
                        value={audioPrompt}
                        onChange={setAudioPrompt}
                        placeholder="Mô tả âm thanh bạn muốn thêm vào video (ví dụ: Âm thanh tự nhiên vui tươi với tiếng chim hót)"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Seed Input */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Seed (Tùy chọn)
                </label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="Seed (để trống = ngẫu nhiên)"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                  max="4294967295"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full px-6 py-3"
                size="lg"
              >
                {isGenerating ? 'Đang tạo video...' : 'Tạo Video'}
              </Button>
            </Card>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-3">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generations.map((generation) => {
                    console.log(`Rendering generation ${generation.id}: status=${generation.status}, videoUrl=${generation.videoUrl}`);
                    return (
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
                      
                      {/* Show video result if available, otherwise show input image */}
                      {generation.videoUrl ? (
                        <div className="mb-3">
                          <video
                            src={generation.videoUrl}
                            controls
                            className="w-full h-32 object-cover rounded"
                            poster={generation.inputImageUrl}
                            key={`${generation.id}-${generation.status}`} // Force re-render when status changes
                          />
                        </div>
                      ) : generation.status === 'processing' ? (
                        <div className="mb-3 flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 rounded">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Đang xử lý video...</p>
                          </div>
                        </div>
                      ) : null}
                       
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed line-clamp-2">
                        {generation.prompt}
                      </p>
                      
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span>{generation.aspectRatio}</span>
                        <span>{generation.duration}s</span>
                        {generation.seed && <span>Seed: {generation.seed}</span>}
                      </div>
                      
                      {generation.videoUrl && (
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => {
                              // Force download video instead of opening in new tab
                              const link = document.createElement('a');
                              link.href = generation.videoUrl;
                              link.download = `video-${generation.id}.mp4`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                          >
                            Tải xuống
                          </button>
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default VideoGeneration;