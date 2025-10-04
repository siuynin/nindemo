import React, { useState, useEffect } from 'react'; 
import { Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { generateService } from '../services/generateService';

interface ImageItem {
  id: string;
  url: string;
  name: string;
  createdAt: Date;
  size?: string;
  dimensions?: string;
  prompt?: string;
  model?: string;
}

const ImageTools: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [recentImages, setRecentImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent images from API
  useEffect(() => {
    const fetchRecentImages = async () => {
      try {
        setLoading(true);
        const response = await generateService.getGenerates({
          type: 'image',
          per_page: 12, // Lấy 12 ảnh gần đây nhất
          page: 1
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
              model: contentData?.model || 'Unknown',
              size: '2.4 MB', // Placeholder - có thể tính toán thực tế nếu cần
              dimensions: `${contentData?.width || 1024}x${contentData?.height || 1024}`
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

    fetchRecentImages();
  }, []);

  const handleImageClick = (image: ImageItem) => {
    // Handle image click - open in editor, show details, etc.
    console.log('Clicked image:', image);
  };

  const handleImageAction = (action: string, image: ImageItem) => {
    // Handle image actions like edit, delete, download
    console.log(`${action} image:`, image.name);
  };
 

  return (
    <>
      <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Image Tools</h1>
          <div className="flex space-x-3">
            <button className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
              Upload Images
            </button>
            <button className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}>
              Create New
            </button>
          </div>
        </div>

        {/* Recent Images Section */}
        <div className="mb-12">
          <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Recent Images</h2>
          <div className="grid grid-cols-6 gap-4">
            {recentImages.map((image) => (
              <div
                key={image.id}
                className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
                onClick={() => handleImageClick(image)}
              >
                <div className="relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageAction('edit', image);
                        }}
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageAction('download', image);
                        }}
                        className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700"
                        title="Download"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageAction('delete', image);
                        }}
                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className={`font-medium text-sm truncate mb-1 ${
                    theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {image.name}
                  </h3>
                  <p className={`text-xs mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {image.size} • {image.dimensions}
                  </p>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`}>
                    {image.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Available Tools</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { name: 'Image Editor', icon: '🎨', description: 'Edit images', link: null },
              { name: 'AI Enhancer', icon: '✨', description: 'Enhance with AI', link: null },
              { name: 'Background Remove', icon: '🎯', description: 'Remove backgrounds', link: null },
              { name: 'Resize', icon: '📐', description: 'Resize images', link: null },
              { name: 'Compress', icon: '🗜️', description: 'Compress files', link: null },
              { name: 'AI Upscaler', icon: '🔍', description: 'Upscale with AI', link: '/app/image-tools/upscaler' }
            ].map((tool) => (
              <div
                key={tool.name}
                className={`rounded-lg shadow-md p-4 text-center hover:shadow-lg transition-shadow cursor-pointer ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
                onClick={() => {
                  if (tool.link) {
                    navigate(tool.link);
                  }
                }}
              >
                <div className="text-3xl mb-2">{tool.icon}</div>
                <h3 className={`font-medium text-sm mb-1 ${
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>{tool.name}</h3>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>{tool.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className={`rounded-lg shadow-md p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
          }`}>Storage Stats</h2>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{recentImages.length}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Total Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">12.5 GB</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Used Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">87.5 GB</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Free Space</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">24</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>This Week</div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <Outlet />
    </>
  );
};

export default ImageTools;