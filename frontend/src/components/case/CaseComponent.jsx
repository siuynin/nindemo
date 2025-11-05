import React, { useState, useEffect } from 'react';
import CreativeEditor, { useConfig, useConfigure, useCreativeEditor } from './lib/CreativeEditor';
import VersionInfo from '../../components/VersionInfo';
import './styles.css';

const CaseComponent = () => {
  const [cesdk, setCesdk] = useCreativeEditor();
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState('Design');

  useEffect(() => {
    // Simulate loading delay for Creative SDK initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Tăng thời gian loading để SDK kịp khởi tạo

    return () => clearTimeout(timer);
  }, []);

  // Xử lý khi CESDK instance thay đổi
  useEffect(() => {
    if (cesdk) {
      console.log('CESDK instance created successfully');
      setIsLoading(false);
    }
  }, [cesdk]);

  // Creative SDK Configuration - Use trial/demo license
  const config = useConfig(
    () => ({
      license: import.meta.env.VITE_NEXT_PUBLIC_LICENSE || 'demo-license-key-12345-67890-ABCDE-FGHIJ-KLMNO', // Use license from env or fallback to demo
      userId: 'demo-user',
      baseURL: 'https://cdn.img.ly/packages/imgly/cesdk-js/1.60.0/assets',
      role: 'Creator'
    }),
    []
  );

  // Configure the Creative SDK instance
  const configure = useConfigure(
    async (instance) => {
      // Basic configuration for the editor
      if (instance) {
        try {
          // Add demo asset sources
          instance.addDemoAssetSources({ sceneMode: 'Design', withUploadAssetSources: true });
          
          // Set theme
          instance.ui.setTheme('light');
          
          // Create a design scene
          await instance.createDesignScene();
          
          // Get the current scene
          const scene = instance.scene.get();
          
          // Configure for different modes
          if (mode === 'Design') {
            instance.block.setFloat(scene, 'scene/pageWidth', 800);
            instance.block.setFloat(scene, 'scene/pageHeight', 600);
            instance.block.setEnum(scene, 'scene/pageUnit', 'Pixel');
          } else if (mode === 'Photo') {
            instance.block.setFloat(scene, 'scene/pageWidth', 1200);
            instance.block.setFloat(scene, 'scene/pageHeight', 800);
            instance.block.setEnum(scene, 'scene/pageUnit', 'Pixel');
          }
          
          // Enable text editing features
          instance.editor.setSetting('text/enableEditing', true);
          
          // Enable basic editing features for demo mode
          instance.editor.setSetting('image/enableEditing', true);
          instance.editor.setSetting('shape/enableEditing', true);
          
          // Add some sample content
          const pages = instance.block.findByType('page');
          if (pages && pages.length > 0) {
            const page = pages[0];
            
            // Add a sample text block
            const textBlock = instance.block.create('text');
            if (textBlock) {
              instance.block.setString(textBlock, 'text/text', 'Welcome to Creative Editor!');
              instance.block.setFloat(textBlock, 'text/fontSize', 48);
              instance.block.setPositionX(textBlock, 100);
              instance.block.setPositionY(textBlock, 100);
              instance.block.appendChild(page, textBlock);
            }
            
            // Add a sample shape
            const shapeBlock = instance.block.create('shape');
            if (shapeBlock) {
              instance.block.setString(shapeBlock, 'shape/shapeType', 'rect');
              instance.block.setFloat(shapeBlock, 'shape/width', 200);
              instance.block.setFloat(shapeBlock, 'shape/height', 100);
              instance.block.setPositionX(shapeBlock, 300);
              instance.block.setPositionY(shapeBlock, 200);
              instance.block.setColorRGBA(shapeBlock, 'fill/solid/color', 0.2, 0.6, 1.0, 1.0); // Blue color
              instance.block.appendChild(page, shapeBlock);
            }
          }
        } catch (error) {
          console.warn('Creative SDK configuration error:', error);
          // Continue without sample content if there are errors
        }
      }
    },
    [mode]
  );

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <div className="ml-4 text-lg">Loading Creative Editor...</div>
      </div>
    );
  }

  return (
    <div className="gap-sm flex flex-grow flex-col" style={{ minHeight: '100vh' }}>
      <div className="flex w-full flex-col items-center p-4">
        <h2 className="text-2xl font-bold mb-4">Creative Editor</h2>
        <div className="flex gap-2 mb-4">
          <button 
            className={`px-4 py-2 rounded ${mode === 'Design' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
            onClick={() => handleModeChange('Design')}
          >
            Design
          </button>
          <button 
            className={`px-4 py-2 rounded ${mode === 'Photo' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
            onClick={() => handleModeChange('Photo')}
          >
            Photo
          </button>
          <button 
            className={`px-4 py-2 rounded ${mode === 'Video' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
            onClick={() => handleModeChange('Video')}
          >
            Video
          </button>
        </div>
      </div>
      
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          height: '740px',
          padding: '1rem'
        }}
      >
        <div
          className="cesdkWrapperStyle border border-gray-300 rounded-lg"
          key={mode}
          style={{ flex: 1 }}
        >
          <CreativeEditor
            className="cesdkStyle w-full h-full"
            config={config}
            configure={configure}
            onInstanceChange={setCesdk}
          />
        </div>
        
        <div className="w-80 bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3">AI Tools Panel</h4>
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded border">
              <div className="font-medium">Text Generation</div>
              <div className="text-sm text-gray-600">AI-powered text creation</div>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
              <div className="font-medium">Image Generation</div>
              <div className="text-sm text-gray-600">Create images with AI</div>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
              <div className="font-medium">Background Removal</div>
              <div className="text-sm text-gray-600">Remove image backgrounds</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Version Info Footer */}
      <div className="w-full p-2 bg-gray-100 border-t border-gray-200">
        <VersionInfo />
      </div>
    </div>
  );
};

export default CaseComponent;
