import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import { generateService } from '../services/generateService';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  seed?: number;
  createdAt: Date;
  status: 'completed' | 'processing' | 'failed';
  generateId?: string;
}

const ImageCreatorDebug: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      alert('Bạn cần đăng nhập để truy cập trang này.');
      navigate('/login'); // Chuyển hướng đến trang đăng nhập
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading authentication status...</div>;
  }

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => prev + '\n' + new Date().toLocaleTimeString() + ': ' + info);
    console.log('Debug:', info);
  };

  const fetchGeneratedImages = async () => {
    if (!isAuthenticated || !user?.id) {
      addDebugInfo('Không thể fetch: Người dùng chưa đăng nhập hoặc user.id không tồn tại');
      alert('Vui lòng đăng nhập để xem ảnh đã tạo');
      return;
    }

    setLoading(true);
    addDebugInfo('Bắt đầu fetch ảnh...');

    // Thông tin người dùng và token để debug cho rõ ràng
    addDebugInfo(user?.id ? `User ID: ${user.id}` : 'User ID: N/A');
    const tokenCheck = authService.getToken() || localStorage.getItem('token');
    addDebugInfo(`Token tồn tại: ${!!tokenCheck}`);
    if (!tokenCheck) {
      addDebugInfo('Không tìm thấy token trong localStorage');
    }

    // Log URL API thực tế
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
    addDebugInfo(`Gọi API: ${apiBaseUrl}/generations`);
    
    try {
      // Xóa cache để debug
      sessionStorage.removeItem('generated_images');
      addDebugInfo('Đã xóa cache sessionStorage');

      addDebugInfo('Gọi generateService.getImageGenerations...');
      const response = await generateService.getImageGenerations({}, {
        showAuthModal: () => {
          addDebugInfo('showAuthModal được gọi: Phiên đăng nhập đã hết hạn.');
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        },
        onError: (error) => {
          console.error('❌ Error fetching image generations:', error);
          addDebugInfo(`Lỗi fetching image generations trong callback: ${error.message}`);
          alert('Không thể tải danh sách hình ảnh');
          setLoading(false);
        }
      });

      addDebugInfo(`Phản hồi từ generateService: ${JSON.stringify(response)}`);
      addDebugInfo(`Response success: ${response.success}`);

      if (response.success && response.data) {
        const images: GeneratedImage[] = response.data.map((item: any) => ({
          id: item.id || item.generateId || Math.random().toString(),
          url: item.result_url || item.imageUrl || item.url || item.image_url || '',
          prompt: item.prompt || item.textPrompt || '',
          seed: item.seed || item.imageSeed || null,
          createdAt: new Date(item.created_at || item.createdAt || Date.now()),
          status: item.status || 'completed',
          generateId: item.generateId || item.id || '',
        }));

        addDebugInfo(`Đã parse được ${images.length} ảnh`);
        setGeneratedImages(images);
        
        // Lưu vào sessionStorage để debug
        sessionStorage.setItem('generated_images', JSON.stringify(images));
        addDebugInfo('Đã lưu vào sessionStorage');
        
        alert(`Tải thành công ${images.length} ảnh`);
      } else {
        addDebugInfo(`Response không thành công hoặc không có data: ${JSON.stringify(response)}`);
        alert('Không thể tải danh sách hình ảnh');
      }
    } catch (error) {
      console.error('❌ Lỗi trong fetchGeneratedImages:', error);
      addDebugInfo(`Lỗi trong fetchGeneratedImages: ${error.message}`);
      alert('Có lỗi xảy ra khi tải ảnh');
    } finally {
      setLoading(false);
      addDebugInfo('Kết thúc fetch');
    }
  };

  const testDirectAPI = async () => {
    addDebugInfo('=== TEST DIRECT API ===');
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        addDebugInfo('Không có token để test');
        return;
      }

      // Test với endpoint khác để kiểm tra xác thực
      const testUrl = 'http://127.0.0.1:8001/api/user/profile';
      addDebugInfo(`Test API: ${testUrl}`);
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      addDebugInfo(`Test response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addDebugInfo(`Test thành công: ${JSON.stringify(data)}`);
      } else {
        const errorText = await response.text();
        addDebugInfo(`Test thất bại: ${errorText}`);
      }
    } catch (error) {
      addDebugInfo(`Lỗi test: ${error}`);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo('');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Image Creator Debug
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Trạng thác xác thực
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Đăng nhập: {isAuthenticated ? '✅ Đã đăng nhập' : '❌ Chưa đăng nhập'}
            </p>
            {user && (
              <p className="text-gray-600 dark:text-gray-400">
                User ID: {user.id} | Email: {user.email}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={fetchGeneratedImages}
              disabled={loading || !isAuthenticated}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Đang tải...' : 'Tải ảnh đã tạo'}
            </button>
            
            <button
              onClick={testDirectAPI}
              disabled={!isAuthenticated}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              Test API xác thực
            </button>
            
            <button
              onClick={clearDebugInfo}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Xóa debug log
            </button>
          </div>
        </div>

        {/* Debug Info Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Debug Log
          </h2>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {debugInfo || 'Chưa có log...'}
          </div>
        </div>

        {/* Generated Images */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Ảnh đã tạo ({generatedImages.length})
          </h2>
          
          {generatedImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Chưa có ảnh nào được tạo</p>
                <p className="text-sm mt-2">Nhấn "Tải ảnh đã tạo" để xem danh sách</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((image) => (
                <div key={image.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-600">
                    {image.url ? (
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          addDebugInfo(`Lỗi tải ảnh: ${image.url}`);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                      {image.prompt || 'Không có mô tả'}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Seed: {image.seed || 'N/A'}</span>
                      <span>Status: {image.status}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ID: {image.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCreatorDebug;