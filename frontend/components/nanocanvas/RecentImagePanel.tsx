import React, { useState, useEffect } from 'react';
import { ChevronRightIcon } from '../icons';
import { generateService, Generate } from '../../services/generateService';

interface RecentImagePanelProps {
  onAddImageToCanvas: (imageUrl: string) => void;
}

interface ImageItem {
  id: string;
  url: string;
  name: string;
  createdAt: Date;
  prompt?: string;
  model?: string;
}

const RecentImagePanel: React.FC<RecentImagePanelProps> = ({ onAddImageToCanvas }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recentImages, setRecentImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch recent images from API
  const fetchRecentImages = async () => {
    try {
      setLoading(true);
      const response = await generateService.getGenerates({
        type: 'image',
        per_page: 10, // Lấy 10 ảnh gần đây nhất
        page: 1,
        status: 'completed' // Chỉ lấy ảnh đã hoàn thành
      });
      
      if (response.success && response.data) {
        const images: ImageItem[] = response.data.flatMap(generate => {
          let imageData: Array<{seed: number, url: string}> = [];
          let contentData = null;
          
          // Parse result_url để lấy array các object {seed, url} từ Runware
          if (generate.result_url) {
            try {
              const resultData = JSON.parse(generate.result_url);
              if (Array.isArray(resultData)) {
                imageData = resultData.filter(item => 
                  item && 
                  typeof item === 'object' && 
                  item.url && 
                  typeof item.url === 'string'
                );
              }
            } catch (parseError) {
              console.error('Error parsing result_url:', parseError);
            }
          }
          
          // Parse content để lấy thông tin prompt và model
          if (generate.content) {
            try {
              contentData = JSON.parse(generate.content);
            } catch (parseError) {
              console.error('Error parsing content:', parseError);
            }
          }
          
          // Tạo một ImageItem cho mỗi object ảnh
          return imageData.map((imageItem, index) => ({
            id: `${generate.id}-${index}`,
            url: imageItem.url,
            name: generate.name || `Image ${generate.id}-${index}`,
            createdAt: new Date(generate.created_at),
            prompt: contentData?.prompt || '',
            model: contentData?.model || 'Unknown'
          }));
        }).filter(img => img.url); // Chỉ hiển thị ảnh có URL hợp lệ
        
        setRecentImages(images);
      }
    } catch (error) {
      console.error('Error fetching recent images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load images when component mounts or when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchRecentImages();
    }
  }, [isOpen]);

  const handleImageClick = (imageUrl: string) => {
    onAddImageToCanvas(imageUrl);
  };

  const handleClearAll = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả ảnh gần đây?')) {
      // Note: API không hỗ trợ xóa hàng loạt, có thể cần implement riêng
      setRecentImages([]);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    // Note: Cần implement API để xóa ảnh cụ thể
    setRecentImages(prev => prev.filter(img => img.id !== imageId));
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-t-lg shadow-lg transition-colors"
          title={isOpen ? "Đóng Recent Images" : "Mở Recent Images"}
        >
          <ChevronRightIcon 
            className={`w-5 h-5 transition-transform duration-300 ${
              isOpen ? 'rotate-90' : '-rotate-90'
            }`} 
          />
        </button>
      </div>

      {/* Panel Content */}
      <div className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="bg-gray-900 border-t border-gray-700 p-2 max-h-48 overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-medium text-sm">Recent Images</h3>
          <div className="flex space-x-2">
            <button
              onClick={fetchRecentImages}
              disabled={loading}
              className="text-blue-400 hover:text-blue-300 text-xs disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={handleClearAll}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              Clear All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="text-gray-400 text-sm">Đang tải ảnh...</div>
          </div>
        ) : recentImages.length === 0 ? (
          <div className="text-gray-400 text-center py-4 text-sm">
            Chưa có ảnh nào được tạo
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {recentImages.map((image) => (
              <div
                key={image.id}
                className="relative group cursor-pointer"
                onClick={() => handleImageClick(image.url)}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-16 h-16 object-cover rounded border border-gray-600 hover:border-blue-400 transition-colors"
                  title={`${image.name}\nPrompt: ${image.prompt}\nModel: ${image.model}`}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(image.id);
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa ảnh"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}</div>
      </div>
    </>
  );
};

// Function to save new image to API (to be called when generating/uploading images)
export const addToRecentImages = async (imageUrl: string, prompt?: string, model?: string) => {
  try {
    // Create a new generate record in the database
    await generateService.createGenerate({
      name: `Generated Image ${Date.now()}`,
      content: JSON.stringify({
        prompt: prompt || '',
        model: model || 'Unknown',
        width: 1024,
        height: 1024
      }),
      type: 'image',
      status: 'completed',
      share: 'private',
      result_url: JSON.stringify([{ seed: Date.now(), url: imageUrl }]),
      credit_cost: 0
    });
  } catch (error) {
    console.error('Error saving image to recent images:', error);
  }
};

export default RecentImagePanel;