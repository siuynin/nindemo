import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PenIcon, ImageIcon, PencilIcon } from '../components/icons';
import InstallPrompt from '../components/InstallPrompt';

interface PublicGenerate {
  id: number;
  user_id: number;
  name: string;
  type: string;
  result_url: string | { seed: number; url: string }[];
  content: string | { prompt: string }[];
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [publicImages, setPublicImages] = useState<PublicGenerate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PublicGenerate | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Helper function to get image URL from result_url
  const getImageUrl = (result_url: string | { seed: number; url: string }[]): string => {
    if (typeof result_url === 'string') {
      try {
        const parsed = JSON.parse(result_url);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
          return parsed[0].url;
        }
      } catch (error) {
        // If parsing fails, assume it's already a URL string
        return result_url;
      }
    } else if (Array.isArray(result_url) && result_url.length > 0) {
      return result_url[0].url;
    }
    return '';
  };

  const services = [
    {
      title: t.sidebar.imageCanvas.title,
      description: t.sidebar.imageCanvas.description,
      icon: <PencilIcon className="w-10 h-10" />,
      link: '/image-canvas',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      title: t.sidebar.textToSpeech.title,
      description: t.sidebar.textToSpeech.description,
      icon: <PenIcon className="w-10 h-10" />,
      link: '/text-to-speech',
      gradient: 'from-green-500 to-teal-600'
    },
    {
      title: t.sidebar.imageCreator.title,
      description: t.sidebar.imageCreator.description,
      icon: <ImageIcon className="w-10 h-10" />,
      link: '/image-creator',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      title: t.sidebar.videoGeneration?.title || 'Video Generation',
      description: t.sidebar.videoGeneration?.description || 'Create amazing videos with AI',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      link: '/app/video-generation',
      gradient: 'from-purple-500 to-indigo-600'
    }
  ];

  // Fetch public images
  const fetchPublicImages = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/public-generates?page=${page}&per_page=20&type=image`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setPublicImages(prev => [...prev, ...data.data]);
        } else {
          setPublicImages(data.data);
        }
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching public images:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more images
  const loadMore = () => {
    if (pagination && pagination.current_page < pagination.last_page && !loadingMore) {
      fetchPublicImages(pagination.current_page + 1, true);
    }
  };

  // Lazy loading intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img) => observer.observe(img));

    return () => observer.disconnect();
  }, [publicImages]);

  // Initial load
  useEffect(() => {
    fetchPublicImages();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16"> 

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service, index) => (
            <Link
              key={index}
              to={service.link}
              className={`group p-6 rounded-xl transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:bg-gray-800'
                  : 'bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white'
              }`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${service.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <div className="text-white">
                  {service.icon}
                </div>
              </div>
              <h3 className={`text-lg font-bold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {service.title}
              </h3>
              <p className={`text-sm leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {service.description}
              </p>
              <div className={`mt-4 flex items-center text-xs font-medium ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {t.homepage?.explore || 'Khám phá'} →
              </div>
            </Link>
          ))}
        </div>

        {/* Public Images Gallery */}
        <div className={` mb-16 ${
          theme === 'dark'
            ? 'bg-gray-800/30   border-gray-700'
            : 'bg-white/50 r border-gray-200'
        }`}> 
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-12 w-12"></div>
            </div>
          ) : (
            <>
              {/* Masonry Grid */}
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
                {publicImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="break-inside-avoid overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group relative"
                    style={{
                      background: theme === 'dark' 
                        ? 'linear-gradient(135deg, #1f2937 0%, #374151 100%)' 
                        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                    }}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        data-src={getImageUrl(image.result_url)}
                        alt={image.name}
                        className="w-full h-auto object-cover lazy-load transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6' }}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.classList.add('loaded');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <button 
                          onClick={() => {
                            setSelectedImage(image);
                            setShowModal(true);
                          }}
                          className="px-6 py-2 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full font-medium transform scale-95 group-hover:scale-100 transition-all duration-300 hover:bg-white hover:scale-105"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                    <div className="p-2 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className={`font-semibold text-sm mb-2 line-clamp-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {image.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {image.user?.name || 'Anonymous'}
                        </span>
                        <span className={`text-xs ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {new Date(image.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {pagination && pagination.current_page < pagination.last_page && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      loadingMore
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:-translate-y-1'
                    } text-white shadow-lg hover:shadow-xl`}
                  >
                    {loadingMore ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang tải...
                      </div>
                    ) : (
                      'Xem thêm'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Features Section */}
        <div className={`text-center p-12 rounded-2xl ${
          theme === 'dark'
            ? 'bg-gray-800/30 border border-gray-700'
            : 'bg-white/50 border border-gray-200'
        }`}>
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {t.homepage?.whyChoose || 'Tại sao chọn AI Studio?'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t.homepage?.fastPowerful || 'Nhanh & Mạnh mẽ'}
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t.homepage?.fastDesc || 'Công nghệ AI tiên tiến cho kết quả nhanh chóng và chính xác'}
              </p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t.homepage?.easyToUse || 'Dễ sử dụng'}
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t.homepage?.easyDesc || 'Giao diện thân thiện, không cần kinh nghiệm kỹ thuật'}
              </p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t.homepage?.creative || 'Sáng tạo'}
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t.homepage?.creativeDesc || 'Giải phóng tiềm năng sáng tạo với công cụ AI đa dạng'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Install Prompt */}
      <InstallPrompt />

      {/* Modal popup */}
      {showModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`relative max-w-6xl w-full max-h-[90vh] rounded-xl overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Close button at modal corner */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full flex items-center justify-center transition-all duration-200"
            >
              ✕
            </button>
            
            <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
              {/* Image Section */}
              <div className="lg:w-2/3 p-6 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={getImageUrl(selectedImage.result_url)}
                    alt={selectedImage.name}
                    className="max-h-[90vh] w-auto object-contain rounded-lg"
                  />
                </div>
              </div>
              
              {/* Content Section */}
              <div className="lg:w-1/3 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Prompt Section */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Prompt
                    </h3>
                    <div className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <p className={`text-sm leading-relaxed ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {(() => {
                          console.log('Modal selectedImage.content:', selectedImage.content);
                          console.log('Modal content type:', typeof selectedImage.content);
                          
                          if (!selectedImage.content) return 'Không có thông tin prompt';
                          
                          // Content trong database là longText, có thể là JSON string hoặc plain text
                          if (typeof selectedImage.content === 'string') {
                            // Thử parse JSON nếu là string
                            try {
                              const parsed = JSON.parse(selectedImage.content);
                              console.log('Parsed content:', parsed);
                              
                              // Nếu parsed là array
                              if (Array.isArray(parsed)) {
                                return parsed.map((item, index) => (
                                  <span key={index} className="block mb-2 last:mb-0">
                                    {typeof item === 'object' ? (item.prompt || item.text || JSON.stringify(item)) : item}
                                  </span>
                                ));
                              }
                              
                              // Nếu parsed là object
                              if (typeof parsed === 'object') {
                                return parsed.prompt || parsed.text || JSON.stringify(parsed);
                              }
                              
                              // Nếu parsed là string/number
                              return parsed.toString();
                              
                            } catch (e) {
                              console.log('Content is not JSON, displaying as plain text');
                              // Không phải JSON, hiển thị như plain text
                              return selectedImage.content;
                            }
                          }
                          
                          // Nếu content đã là object/array (không phải string)
                          if (Array.isArray(selectedImage.content)) {
                            return selectedImage.content.map((item, index) => (
                              <span key={index} className="block mb-2 last:mb-0">
                                {typeof item === 'object' ? (item.prompt || item.text || JSON.stringify(item)) : item}
                              </span>
                            ));
                          }
                          
                          if (typeof selectedImage.content === 'object') {
                            return selectedImage.content.prompt || selectedImage.content.text || JSON.stringify(selectedImage.content);
                          }
                          
                          return selectedImage.content.toString();
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <h4 className={`text-xs font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Tạo bởi
                      </h4>
                      <p className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>
                        {selectedImage.user?.name || 'Anonymous'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <h4 className={`text-xs font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Ngày tạo
                      </h4>
                      <p className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>
                        {new Date(selectedImage.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-3 pt-4">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = getImageUrl(selectedImage.result_url);
                        link.download = `${selectedImage.name}.png`;
                        link.click();
                      }}
                      className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Tải xuống</span>
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .lazy-load {
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
          }
          .lazy-load.loaded {
            opacity: 1;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />
    </div>
  );
};

export default HomePage;