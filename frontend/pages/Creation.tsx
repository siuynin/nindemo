import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { generateService, type Generate } from '../services/generateService';
import { DownloadIcon, TrashIcon, PlayIcon } from '../components/icons';
import { Button, Modal, Badge, Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import AuthModal from '../components/AuthModal';

interface FilterState {
  search: string;
  type: string;
  status: string;
}

type ActiveTab = 'all' | 'image' | 'video' | 'audio';

const Creation: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Set page title
  useEffect(() => {
    document.title = 'Creations - AI App';
  }, []);

  const [generates, setGenerates] = useState<Generate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    status: ''
  });
  
  // Auth modal state
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' as 'login' | 'register' });
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; visible: boolean }>({ message: '', type: 'success', visible: false });
  
  // Show toast function
  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };
  
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

  // Video modal state
  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    title: string;
  }>({
    isOpen: false,
    videoUrl: '',
    title: ''
  });

  // Image modal state
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    prompt?: string;
    width?: number;
    height?: number;
    createdAt?: Date;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    prompt: '',
    width: 1024,
    height: 1024,
    createdAt: undefined
  });

  // Fetch generations from API
  const fetchGenerations = async () => {
    console.log('🚀 Starting fetchGenerations...');
    console.log('🔐 Is authenticated:', isAuthenticated);
    console.log('📋 Active tab:', activeTab);
    console.log('🔍 Filters:', filters);
    
    // Check if user is authenticated before making API call
    if (!isAuthenticated || !user) {
      console.log('❌ User not authenticated, skipping fetch');
      setGenerates([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const params = {
        per_page: 40 // Giảm từ 50 xuống 40 để tải nhanh hơn
      };

      console.log('🌐 Fetching generations with params:', params);

      let response;
      
      // Use specific endpoints based on active tab for better performance
      if (activeTab === 'image') {
        response = await generateService.getImageGenerations(params, {
          showAuthModal: () => setAuthModal({ isOpen: true, mode: 'login' }),
          onError: (error) => {
            console.error('❌ Error fetching image generations:', error);
            showToast('Không thể tải danh sách hình ảnh', 'error');
            setLoading(false);
          }
        });
      } else if (activeTab === 'audio' || activeTab === 'video') {
        // For audio and video, use creation generations endpoint
        response = await generateService.getCreationGenerations(params, {
          showAuthModal: () => setAuthModal({ isOpen: true, mode: 'login' }),
          onError: (error) => {
            console.error('❌ Error fetching creation generations:', error);
            showToast('Không thể tải danh sách creations', 'error');
            setLoading(false);
          }
        });
      } else {
        // For 'all' tab, we need to fetch from multiple endpoints and combine
        const [imageResponse, creationResponse] = await Promise.all([
          generateService.getImageGenerations(params, {
            showAuthModal: () => setAuthModal({ isOpen: true, mode: 'login' }),
            onError: (error) => console.error('❌ Error fetching images:', error)
          }),
          generateService.getCreationGenerations(params, {
            showAuthModal: () => setAuthModal({ isOpen: true, mode: 'login' }),
            onError: (error) => console.error('❌ Error fetching creations:', error)
          })
        ]);
        
        // Combine results
        const allGenerations = [
          ...(imageResponse?.data || []),
          ...(creationResponse?.data || [])
        ];
        
        // Sort by created_at descending
        allGenerations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        response = {
          success: true,
          data: allGenerations,
          pagination: imageResponse?.pagination || creationResponse?.pagination
        };
      }
      
      console.log('📊 Response data:', response);
      
      if (response && response.success && Array.isArray(response.data)) {
        console.log('✅ Response successful, processing data...', response.data.length, 'items');
        
        let filteredGenerations = response.data;
        
        // Apply tab filter if not already filtered by endpoint
        if (activeTab !== 'all' && (activeTab === 'audio' || activeTab === 'video')) {
          filteredGenerations = filteredGenerations.filter(
            (gen: Generate) => gen.type === activeTab
          );
        }
        
        // Apply search filter
        if (filters.search) {
          filteredGenerations = filteredGenerations.filter((gen: Generate) =>
            gen.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            gen.prompt?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        
        // Apply status filter
        if (filters.status && filters.status !== 'all') {
          filteredGenerations = filteredGenerations.filter(
            (gen: Generate) => gen.status === filters.status
          );
        }
        
        // Parse result_url for images to handle multiple images like in ImageCreator
        const processedGenerations = filteredGenerations.map((gen: Generate) => {
          if (gen.type === 'image' && gen.result_url) {
            try {
              const resultData = JSON.parse(gen.result_url);
              if (Array.isArray(resultData) && resultData.length > 0) {
                // For images with multiple results, create a preview with the first image
                return {
                  ...gen,
                  result_url: resultData[0].url || gen.result_url,
                  imageCount: resultData.length
                };
              }
            } catch (parseError) {
              console.error('Error parsing image result_url:', parseError);
            }
          }
          return gen;
        });
        
        console.log('🎨 Processed generations:', processedGenerations.length, 'items');
        setGenerates(processedGenerations);
        setLoading(false);
      } else {
        console.log('❌ API response failed or no data:', response);
        setGenerates([]);
        setLoading(false);
        showToast('Không thể tải danh sách creations', 'error');
      }
    } catch (error) {
      console.error('❌ Error in fetchGenerations:', error);
      setGenerates([]);
      setLoading(false);
      showToast('Có lỗi xảy ra khi tải danh sách creations', 'error');
      // Error handling is already done in generateService
    }
  };

  // Delete generation
  const handleDeleteGeneration = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa creation này?')) return;
    
    try {
      const response = await generateService.deleteGenerate(id);
      if (response.success) {
        alert('Xóa creation thành công');
        fetchGenerations();
      }
    } catch (error) {
      console.error('Error deleting generation:', error);
      alert('Không thể xóa creation');
    }
  };

  // Handle play audio
  const handlePlayAudio = (generation: Generate) => {
    if (generation.result_url) {
      setAudioPlayer({
        isVisible: true,
        audioUrl: generation.result_url,
        title: generation.name || 'Audio',
        isPlaying: true
      });
    } else {
      alert('Không tìm thấy file audio để phát');
    }
  };

  // Handle play video
  const handlePlayVideo = (generation: Generate) => {
    if (generation.result_url) {
      setVideoModal({
        isOpen: true,
        videoUrl: generation.result_url,
        title: generation.name || 'Video'
      });
    } else {
      alert('Không tìm thấy file video để phát');
    }
  };

  // Handle view image
  const handleViewImage = (generation: Generate) => {
    if (generation.result_url) {
      // Parse content to get additional image details
      let prompt = generation.name || '';
      let width = 1024;
      let height = 1024;
      
      if (generation.content) {
        try {
          const contentData = JSON.parse(generation.content);
          prompt = contentData.prompt || generation.name || '';
          width = contentData.width || 1024;
          height = contentData.height || 1024;
        } catch (parseError) {
          console.error('Error parsing content:', parseError);
        }
      }
      
      setImageModal({
        isOpen: true,
        imageUrl: generation.result_url,
        title: generation.name || 'Image',
        prompt: prompt,
        width: width,
        height: height,
        createdAt: new Date(generation.created_at)
      });
    } else {
      alert('Không tìm thấy hình ảnh để xem');
    }
  };

  // Handle download
  const handleDownload = (generation: Generate) => {
    if (generation.result_url) {
      const link = document.createElement('a');
      link.href = generation.result_url;
      link.download = `${generation.name || 'creation'}.${generation.type === 'audio' ? 'mp3' : 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Không tìm thấy file để tải xuống');
    }
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

  // Get status badge color
  const getStatusBadgeColor = (status: string): "success" | "warning" | "error" | "primary" => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'primary';
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'audio': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'video': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // List view component
  const ListView = ({ items }: { items: Generate[] }) => {
    return (
      <div className={`rounded-lg shadow overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Tên</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell>Chi phí</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((generation) => (
              <TableRow key={generation.id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {generation.type === 'image' && (
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {generation.type === 'video' && (
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {generation.type === 'audio' && (
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {generation.name || 'Untitled Creation'}
                      </div>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {generation.content?.substring(0, 50)}...
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getTypeColor(generation.type)}>
                    {generation.type === 'image' ? 'Hình ảnh' : generation.type === 'video' ? 'Video' : 'Audio'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeColor(generation.status)}>
                    {generation.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatDate(generation.created_at)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {generation.credits_used || 0} credits
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {generation.type === 'image' && generation.result_url && (
                      <button
                        onClick={() => handleViewImage(generation)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Xem hình ảnh"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                    )}
                    {generation.type === 'video' && generation.result_url && (
                      <button
                        onClick={() => handlePlayVideo(generation)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Xem video"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                    )}
                    {generation.type === 'audio' && generation.result_url && (
                      <button
                        onClick={() => handlePlayAudio(generation)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Nghe audio"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                    )}
                    {generation.result_url && (
                      <button
                        onClick={() => handleDownload(generation)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="Tải xuống"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteGeneration(generation.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Xóa"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Masonry layout component
  const MasonryGrid = ({ items }: { items: Generate[] }) => {
    const columns = 3; // Number of columns in masonry
    const columnItems: Generate[][] = Array(columns).fill(null).map(() => []);
    
    // Distribute items to columns based on their index
    items.forEach((item, index) => {
      columnItems[index % columns].push(item);
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {columnItems.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-6">
            {column.map((generation) => (
              <div
                key={generation.id}
                className={`rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                {/* Media Preview */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                  {generation.type === 'audio' ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Audio</p>
                      </div>
                    </div>
                  ) : generation.type === 'video' && generation.result_url ? (
                    <div 
                      className="relative w-full h-full cursor-pointer group"
                      onClick={() => handlePlayVideo(generation)}
                    >
                      <video
                        src={generation.result_url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : generation.type === 'image' && generation.result_url ? (
                    <div 
                      className="relative w-full h-full cursor-pointer group"
                      onClick={() => handleViewImage(generation)}
                    >
                      <img
                        src={generation.result_url}
                        alt={generation.name || 'Image'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <PlayIcon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      {generation.imageCount && generation.imageCount > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                          +{generation.imageCount - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {generation.type === 'video' ? 'Video' : 'Hình ảnh'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay with play button - only show for audio */}
                  {generation.type === 'audio' && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <button
                        onClick={() => handlePlayAudio(generation)}
                        className="opacity-0 hover:opacity-100 bg-white bg-opacity-90 rounded-full p-3 transition-all duration-200"
                      >
                        <PlayIcon className="w-6 h-6 text-gray-800" />
                      </button>
                    </div>
                  )}
                  
                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(generation.type)}`}>
                      {generation.type === 'audio' ? 'Audio' : generation.type === 'video' ? 'Video' : 'Hình ảnh'}
                    </span>
                  </div>
                  
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant={getStatusBadgeColor(generation.status)}>
                      {generation.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className={`font-semibold mb-2 line-clamp-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {generation.name || 'Untitled Creation'}
                  </h3>
                   
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span>{formatDate(generation.created_at)}</span>
                    {generation.credits_used && (
                      <span>{generation.credits_used} credits</span>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => 
                        generation.type === 'audio' ? handlePlayAudio(generation) :
                        generation.type === 'image' ? handleViewImage(generation) :
                        handlePlayVideo(generation)
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span>{generation.type === 'image' ? 'Xem' : 'Play'}</span>
                    </button>
                    
                    <button
                      onClick={() => handleDownload(generation)}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md transition-colors duration-200"
                      title="Download"
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteGeneration(generation.id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition-colors duration-200"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Fetch generations when component mounts or filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchGenerations();
    }
  }, [isAuthenticated, filters, activeTab]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Creations</h1>
            <p className={`mt-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>Quản lý hình ảnh, audio và video creations của bạn</p>
          </div>
          
          {!isAuthenticated && (
            <Button
              onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
              variant="primary"
            >
              Đăng nhập để xem creations
            </Button>
          )}
        </div>

        {isAuthenticated && (
          <>
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { key: 'all', label: 'Tất cả', count: generates.length },
                    { key: 'image', label: 'Hình ảnh', count: generates.filter(g => g.type === 'image').length },
                    { key: 'video', label: 'Video', count: generates.filter(g => g.type === 'video').length },
                    { key: 'audio', label: 'Audio', count: generates.filter(g => g.type === 'audio').length }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as ActiveTab)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* View Mode Toggle */}
              <div className="mt-4 flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      viewMode === 'grid'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      viewMode === 'list'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    List
                  </button>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-48 max-w-sm">
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className={`px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="failed">Thất bại</option>
                    <option value="pending">Chờ xử lý</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : generates.length === 0 ? (
              <div className="text-center py-12">
                <div className={`text-6xl mb-4 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  🎨
                </div>
                <h3 className={`text-lg font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Chưa có creations nào
                </h3>
                <p className={`mb-4 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Bạn có thể tạo hình ảnh, audio hoặc video từ các công cụ AI của chúng tôi
                </p>
                <Button
                  onClick={() => navigate('/image-generator')}
                  variant="primary"
                  className="mr-4"
                >
                  Tạo Hình ảnh
                </Button>
                <Button
                  onClick={() => navigate('/text-to-speech')}
                  variant="primary"
                  className="mr-4"
                >
                  Tạo Audio
                </Button>
                <Button
                  onClick={() => navigate('/video-generator')}
                  variant="primary"
                >
                  Tạo Video
                </Button>
              </div>
            ) : (
              viewMode === 'grid' ? (
                <MasonryGrid items={generates} />
              ) : (
                <ListView items={generates} />
              )
            )}
          </>
        )}

        {!isAuthenticated && (
          <div className="text-center py-12">
            <div className={`text-6xl mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              🔒
            </div>
            <h3 className={`text-lg font-medium mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Vui lòng đăng nhập
            </h3>
            <p className={`mb-4 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Bạn cần đăng nhập để xem creations của mình
            </p>
          </div>
        )}
      </div>

      {/* Audio Player */}
      {audioPlayer.isVisible && (
        <ModernAudioPlayer
          audioUrl={audioPlayer.audioUrl}
          title={audioPlayer.title}
          isPlaying={audioPlayer.isPlaying}
          onClose={() => setAudioPlayer(prev => ({ ...prev, isVisible: false }))}
          onPlayPause={(isPlaying) => setAudioPlayer(prev => ({ ...prev, isPlaying }))}
        />
      )}

      {/* Video Modal */}
      <Modal
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal({ isOpen: false, videoUrl: '', title: '' })}
        title={videoModal.title} Ư
      >
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={videoModal.videoUrl}
              controls
              autoPlay
              className="w-full h-full"
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          </div>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal({ isOpen: false, imageUrl: '', title: '', prompt: '', width: 1024, height: 1024, createdAt: undefined })}
        title={imageModal.title}
        size="xl"
      >
        {imageModal.imageUrl && (
          <div className="flex flex-col lg:flex-row gap-6 max-h-[90vh] overflow-hidden">
            {/* Image Section - Left Column */}
            <div className="lg:w-2/3 flex items-center justify-center">
              <div className="relative">
                <img
                  src={imageModal.imageUrl}
                  alt={imageModal.title}
                  className="max-h-[90vh] w-auto object-contain rounded-lg"
                />
              </div>
            </div>
            
            {/* Information Section - Right Column */}
            <div className="lg:w-1/3 flex flex-col space-y-4 overflow-y-auto">
              {/* Image Information */}
              {imageModal.prompt && (
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h3 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Prompt
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                    "{imageModal.prompt}"
                  </p>
                </div>
              )}
              
              {/* Image Details */}
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h4 className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Dimensions
                  </h4>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {imageModal.width} × {imageModal.height}
                  </p>
                </div>
                {imageModal.createdAt && (
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <h4 className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                      Created
                    </h4>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {imageModal.createdAt.toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 pt-4 mt-auto">
                <Button
                  variant="primary"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = imageModal.imageUrl;
                    link.download = `${imageModal.title || 'image'}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  startIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  className="w-full"
                >
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setImageModal({ isOpen: false, imageUrl: '', title: '', prompt: '', width: 1024, height: 1024, createdAt: undefined })}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
        mode={authModal.mode}
        onModeChange={(mode) => setAuthModal(prev => ({ ...prev, mode }))}
        onSuccess={() => {
          setAuthModal({ isOpen: false, mode: 'login' });
          fetchGenerations();
        }}
      />
    </div>
  );
};

export default Creation;