import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';

interface ImageItem {
  id: string;
  url: string;
  name: string;
  createdAt: Date;
  size?: string;
  dimensions?: string;
}

const ImageTools: React.FC = () => {
  const [recentImages, setRecentImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for recent images - replace with actual API call
  useEffect(() => {
    const mockImages: ImageItem[] = [
      {
        id: '1',
        url: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Image+1',
        name: 'summer-vacation.jpg',
        createdAt: new Date('2024-01-15'),
        size: '2.4 MB',
        dimensions: '1920x1080'
      },
      {
        id: '2',
        url: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Image+2',
        name: 'product-shot.png',
        createdAt: new Date('2024-01-14'),
        size: '1.8 MB',
        dimensions: '1200x800'
      },
      {
        id: '3',
        url: 'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=Image+3',
        name: 'landscape-photo.jpg',
        createdAt: new Date('2024-01-13'),
        size: '3.2 MB',
        dimensions: '2560x1440'
      },
      {
        id: '4',
        url: 'https://via.placeholder.com/300x200/96CEB4/FFFFFF?text=Image+4',
        name: 'portrait-mode.jpg',
        createdAt: new Date('2024-01-12'),
        size: '2.1 MB',
        dimensions: '1080x1350'
      },
      {
        id: '5',
        url: 'https://via.placeholder.com/300x200/FECA57/FFFFFF?text=Image+5',
        name: 'macro-shot.png',
        createdAt: new Date('2024-01-11'),
        size: '1.5 MB',
        dimensions: '800x800'
      },
      {
        id: '6',
        url: 'https://via.placeholder.com/300x200/FF6B9D/FFFFFF?text=Image+6',
        name: 'night-sky.jpg',
        createdAt: new Date('2024-01-10'),
        size: '4.1 MB',
        dimensions: '3840x2160'
      }
    ];

    // Simulate API loading
    setTimeout(() => {
      setRecentImages(mockImages);
      setLoading(false);
    }, 1000);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Image Tools</h1>
          <div className="flex space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Upload Images
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Create New
            </button>
          </div>
        </div>

        {/* Recent Images Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Images</h2>
          <div className="grid grid-cols-6 gap-4">
            {recentImages.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
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
                  <h3 className="font-medium text-gray-900 text-sm truncate mb-1">
                    {image.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1">
                    {image.size} • {image.dimensions}
                  </p>
                  <p className="text-xs text-gray-400">
                    {image.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Available Tools</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { name: 'Image Editor', icon: '🎨', description: 'Edit images' },
              { name: 'AI Enhancer', icon: '✨', description: 'Enhance with AI' },
              { name: 'Background Remove', icon: '🎯', description: 'Remove backgrounds' },
              { name: 'Resize', icon: '📐', description: 'Resize images' },
              { name: 'Compress', icon: '🗜️', description: 'Compress files' },
              { name: 'Convert', icon: '🔄', description: 'Format conversion' }
            ].map((tool) => (
              <div
                key={tool.name}
                className="bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="text-3xl mb-2">{tool.icon}</div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">{tool.name}</h3>
                <p className="text-xs text-gray-500">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Storage Stats</h2>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{recentImages.length}</div>
              <div className="text-sm text-gray-500">Total Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">12.5 GB</div>
              <div className="text-sm text-gray-500">Used Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">87.5 GB</div>
              <div className="text-sm text-gray-500">Free Space</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">24</div>
              <div className="text-sm text-gray-500">This Week</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageTools;