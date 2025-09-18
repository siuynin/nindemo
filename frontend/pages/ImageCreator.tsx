import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { runwareApi, RunwareImageResponse } from '../services/runwareApi';
import AIService from '../services/AIService';
import '../styles/slider.css';

interface AIModel {
  id: number;
  name: string;
  slug: string;
  platform: string;
  type: string;
  credit_price: number;
  thumbnail?: string;
  short_description?: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  width: number;
  height: number;
  createdAt: Date;
}

interface ImageGenerationRequest {
  taskType: string;
  taskUUID: string;
  positivePrompt: string;
  width: number;
  height: number;
  model: string;
  numberResults: number;
}

const ImageCreator: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [models, setModels] = useState<AIModel[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [showModelPopup, setShowModelPopup] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);
  const [optimizingPrompt, setOptimizingPrompt] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    prompt: '',
    model: '',
    modelName: '',
    width: 1024,
    height: 1024,
    sizeLabel: '1:1 (Square)',
    numberResults: 1
  });

  // Predefined size options (multiples of 64, max 1536px)
  const sizeOptions = [
    { label: '1:1 (Square)', width: 512, height: 512, ratio: '1:1', category: 'Square' },
    { label: '16:9', width: 1024, height: 576, ratio: '16:9', category: 'Landscape' },
    { label: '4:3', width: 1024, height: 768, ratio: '4:3', category: 'Landscape' },
    { label: '2.35:1', width: 1152, height: 490, ratio: '2.35:1', category: 'Cinematic' },
    { label: '2:1', width: 1024, height: 512, ratio: '2:1', category: 'Panoramic' },
    { label: '1.85:1', width: 1024, height: 553, ratio: '1.85:1', category: 'Film' },
    { label: '9:16', width: 576, height: 1024, ratio: '9:16', category: 'Portrait' },
    { label: '3:4', width: 768, height: 1024, ratio: '3:4', category: 'Portrait' },
    { label: '5.8-inch', width: 375, height: 812, ratio: '5.8-inch', category: 'Mobile' }
  ];

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); // Auto hide after 5 seconds
  };

  // Close toast manually
  const closeToast = () => {
    setToast(null);
  };

  // Load image models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/models/type/image`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setModels(data.data);
            if (data.data.length > 0) {
              setFormData(prev => ({ 
                ...prev, 
                model: data.data[0].slug,
                modelName: data.data[0].name 
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'width' || name === 'height' || name === 'numberResults' ? parseInt(value) : value
    }));
  };

  // Optimize prompt using AI
  const optimizePrompt = async () => {
    if (!formData.prompt.trim() || optimizingPrompt) return;
    
    setOptimizingPrompt(true);
    try {
      const optimizedPrompt = await AIService.processText(
        formData.prompt,
        'improve_writing'
      );
      
      setFormData(prev => ({
        ...prev,
        prompt: optimizedPrompt
      }));
      
      setToast({ message: 'Prompt đã được tối ưu thành công!', type: 'success' });
    } catch (error) {
      console.error('Failed to optimize prompt:', error);
      setToast({ message: 'Không thể tối ưu prompt. Vui lòng thử lại.', type: 'error' });
    } finally {
      setOptimizingPrompt(false);
    }
  };

  // Handle model selection
  const handleModelSelect = (model: AIModel) => {
    setFormData(prev => ({
      ...prev,
      model: model.slug,
      modelName: model.name
    }));
    setShowModelPopup(false);
  };

  // Handle size selection
  const handleSizeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSize = sizeOptions.find(size => size.label === e.target.value);
    if (selectedSize) {
      setFormData(prev => ({
        ...prev,
        width: selectedSize.width,
        height: selectedSize.height,
        sizeLabel: selectedSize.label
      }));
    }
  };

  // Generate image using Runware API
  const generateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prompt.trim() || !formData.model) {
      showToast(t.imageCreator?.errorMessages?.promptRequired || 'Please enter a prompt and select a model', 'warning');
      return;
    }

    // Check if API key is configured
    const apiKey = import.meta.env.VITE_RUNWARE_API_KEY;
    if (!apiKey) {
      showToast(t.imageCreator?.errorMessages?.apiKeyMissing || 'API Key not configured. Please add VITE_RUNWARE_API_KEY to .env file', 'error');
      return;
    }

    setLoading(true);
    
    try {
      // Generate multiple requests if numberResults > 1
      const requests = Array.from({ length: formData.numberResults }, () => ({
        positivePrompt: formData.prompt,
        width: formData.width,
        height: formData.height,
        model: formData.model,
        numberResults: 1 // Each request generates 1 image
      }));

      const results: RunwareImageResponse[] = await runwareApi.generateImages(requests);
      
      // Convert API response to our GeneratedImage format
      const newImages: GeneratedImage[] = results.map((result, index) => ({
        id: result.imageUUID || `${result.taskUUID}-${index}`,
        url: result.imageURL,
        prompt: formData.prompt,
        model: formData.model,
        width: formData.width,
        height: formData.height,
        createdAt: new Date()
      }));
      
      setGeneratedImages(prev => [...newImages, ...prev]);
      
      // Show success message
      showToast(t.imageCreator?.errorMessages?.generateSuccess?.replace('{count}', newImages.length.toString()) || `Successfully generated ${newImages.length} images!`, 'success');
    } catch (error) {
      console.error('Error generating image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      showToast(t.imageCreator?.errorMessages?.generateError?.replace('{error}', errorMessage) || `Could not generate image: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900'}`}>
      <div className="  mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600'}`}>
            ✨ AI Image Creator
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Transform your imagination into stunning visuals with AI
          </p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mx-auto">
          {/* Form Section */}
          <div className={`xl:col-span-4 p-8 rounded-2xl shadow-2xl backdrop-blur-sm border transition-all duration-300 relative ${
            theme === 'dark'
              ? 'bg-gray-800/80 border-gray-700 shadow-purple-500/20'
              : 'bg-white/80 border-gray-200 shadow-blue-500/20'
          }`}>
            <div className="flex items-center mb-8">
              <div className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'} flex items-center justify-center mr-3`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">{t.imageCreator?.createNewImage || 'Create New Image'}</h2>
            </div>
            
            <form onSubmit={generateImage} className="space-y-6">
              {/* Prompt */}
              <div className="relative">
                <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                  {t.imageCreator?.prompt || 'Prompt'} *
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    placeholder={t.imageCreator?.promptPlaceholder || "Describe the image you want to create... e.g., 'A majestic dragon flying over a mystical forest at sunset'"}
                    className={`w-full px-4 py-3 pb-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                      theme === 'dark' 
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-700' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:bg-white'
                    }`}
                    rows={4}
                    required
                  />
                  <button
                    type="button"
                    onClick={optimizePrompt}
                    disabled={!formData.prompt.trim() || optimizingPrompt}
                    title="Tối ưu Prompt"
                    className={`absolute bottom-2 left-2 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      theme === 'dark'
                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {optimizingPrompt ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.872 9.687 20 6.56 17.44 4 4 17.44 6.56 20 16.873 9.687Zm0 0-2.56-2.56M6 7v2m0 0v2m0-2H4m2 0h2m7 7v2m0 0v2m0-2h-2m2 0h2M8 4h.01v.01H8V4Zm2 2h.01v.01H10V6Zm2-2h.01v.01H12V4Zm8 8h.01v.01H20V12Zm-2 2h.01v.01H18V14Zm2 2h.01v.01H20V16Z"/>
                        </svg>

                    )}
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  {t.imageCreator?.model || 'AI Model'} *
                </label>
                {loadingModels ? (
                  <div className="animate-pulse bg-gray-300 h-10 rounded-md"></div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowModelPopup(true)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-center transition-all duration-200 ${
                        theme === 'dark' 
                          ? 'bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600' 
                          : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-white'
                      }`}
                    >
                      <span>{formData.modelName || t.imageCreator?.selectModel || 'Select a model'}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    

                  </>
                )}
              </div>

              {/* Size Selection */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  {t.imageCreator?.imageSize || 'Image Size'}
                </label>
                
                <button
                  type="button"
                  onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center justify-between ${
                    theme === 'dark' 
                      ? 'bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`border-2 flex-shrink-0 ${
                      sizeOptions.find(s => s.label === formData.sizeLabel)?.ratio === '1:1' ? 'w-4 h-4' :
                      sizeOptions.find(s => s.label === formData.sizeLabel)?.ratio === '16:9' ? 'w-6 h-3' :
                      sizeOptions.find(s => s.label === formData.sizeLabel)?.ratio === '4:3' ? 'w-5 h-4' :
                      sizeOptions.find(s => s.label === formData.sizeLabel)?.ratio === '9:16' ? 'w-3 h-6' :
                      sizeOptions.find(s => s.label === formData.sizeLabel)?.ratio === '3:4' ? 'w-4 h-5' :
                      sizeOptions.find(s => s.label === formData.sizeLabel)?.ratio === '2.35:1' ? 'w-7 h-3' :
                      sizeOptions.find(s => s.label === formData.sizeLabel)?.ratio === '2:1' ? 'w-6 h-3' :
                      sizeOptions.find(s => s.label === formData.sizeLabel)?.ratio === '1.85:1' ? 'w-6 h-3' :
                      'w-4 h-4'
                    } ${
                      theme === 'dark' ? 'border-gray-400' : 'border-gray-600'
                    }`}></div>
                    <span>{formData.sizeLabel}</span>
                  </div>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showSizeDropdown && (
                  <div className={`absolute top-full left-0 right-0 mt-1 border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {sizeOptions.map((size) => {
                      const isSelected = formData.sizeLabel === size.label;
                      return (
                        <button
                          key={size.label}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              width: size.width,
                              height: size.height,
                              sizeLabel: size.label
                            }));
                            setShowSizeDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-opacity-10 hover:bg-blue-500 flex items-center space-x-3 border-b last:border-b-0 ${
                            theme === 'dark'
                              ? 'border-gray-600 text-white'
                              : 'border-gray-200 text-gray-900'
                          } ${
                            isSelected
                              ? theme === 'dark'
                                ? 'bg-blue-900 bg-opacity-30'
                                : 'bg-blue-50'
                              : ''
                          }`}
                        >
                          {/* Visual aspect ratio representation */}
                          <div className={`border-2 flex-shrink-0 ${
                            size.ratio === '1:1' ? 'w-6 h-6' :
                            size.ratio === '16:9' ? 'w-8 h-4' :
                            size.ratio === '4:3' ? 'w-7 h-5' :
                            size.ratio === '9:16' ? 'w-4 h-8' :
                            size.ratio === '3:4' ? 'w-5 h-7' :
                            size.ratio === '2.35:1' ? 'w-9 h-4' :
                            size.ratio === '2:1' ? 'w-8 h-4' :
                            size.ratio === '1.85:1' ? 'w-8 h-4' :
                            'w-6 h-6'
                          } ${
                            theme === 'dark' ? 'border-gray-400' : 'border-gray-600'
                          } ${
                            isSelected
                              ? 'border-blue-500'
                              : ''
                          }`}></div>
                          
                          <div className="flex-1">
                            <div className="font-medium">{size.label}</div>
                            <div className={`text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {size.ratio} • {size.category} • {size.width}×{size.height}
                            </div>
                          </div>
                          
                          {isSelected && (
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                 
              </div>

              {/* Number of Results */}
              <div>
                <label htmlFor="numberResults" className="block text-sm font-medium mb-2">
                  {t.imageCreator?.numberResults || 'Number of Images'}: {formData.numberResults}
                </label>
                <div className="px-3">
                  <input
                    type="range"
                    id="numberResults"
                    name="numberResults"
                    min="1"
                    max="4"
                    step="1"
                    value={formData.numberResults}
                    onChange={handleInputChange}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-gray-700 slider-thumb-dark' 
                        : 'bg-gray-200 slider-thumb-light'
                    }`}
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((formData.numberResults - 1) / 3) * 100}%, ${theme === 'dark' ? '#374151' : '#e5e7eb'} ${((formData.numberResults - 1) / 3) * 100}%, ${theme === 'dark' ? '#374151' : '#e5e7eb'} 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={loading || loadingModels}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 ${
                  loading || loadingModels
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl'
                } text-white`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    <span>{t.imageCreator?.generating || 'Creating Magic...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t.imageCreator?.generateImage || 'Generate Image'}
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Generated Images Section */}
          <div className={`xl:col-span-8 p-8 rounded-2xl shadow-2xl backdrop-blur-sm border transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gray-800/80 border-gray-700 shadow-purple-500/20'
              : 'bg-white/80 border-gray-200 shadow-blue-500/20'
          }`}>
            <div className="flex items-center mb-8">
              <div className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gradient-to-r from-green-600 to-blue-600'} flex items-center justify-center mr-3`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">{t.imageCreator?.generatedImages || 'Generated Images'}</h2>
            </div>
            
            {generatedImages.length === 0 ? (
              <div className="text-center py-16">
                <div className={`mx-auto w-32 h-32 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-700 to-gray-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'} rounded-2xl flex items-center justify-center mb-6 animate-pulse`}>
                  <svg className={`w-16 h-16 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.imageCreator?.readyToCreate || 'Ready to Create Magic?'}
                </h3>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                  {t.imageCreator?.imagesWillAppear || 'Your generated images will appear here'}
                </p>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.imageCreator?.fillFormToStart || 'Fill out the form to get started'}
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {generatedImages.map((image, index) => (
                  <div key={image.id} className={`group border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${theme === 'dark' ? 'border-gray-600 bg-gray-700/30 hover:border-gray-500' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'}`}>
                    <div className="relative overflow-hidden rounded-xl mb-4">
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full transition-transform duration-300 group-hover:scale-105"
                        style={{ aspectRatio: `${image.width}/${image.height}` }}
                      />
                      <div className="absolute top-3 right-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-black/50 text-white' : 'bg-white/80 text-gray-700'} backdrop-blur-sm`}>
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                        <p className="text-sm font-medium leading-relaxed" title={image.prompt}>
                          "{image.prompt}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`px-2 py-1 rounded-md text-xs font-medium ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                            {image.model}
                          </div>
                          <div className={`px-2 py-1 rounded-md text-xs font-medium ${theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-600'}`}>
                            {image.width}×{image.height}
                          </div>
                        </div>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {image.createdAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Model Selection Popup - Full Screen Outside Container */}
      {showModelPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] dark:bg-black/70 p-4">
          <div className={`w-full h-full max-w-7xl max-h-full overflow-hidden rounded-2xl shadow-2xl flex flex-col ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                🤖 {t.imageCreator?.selectAIModel || 'Select AI Model'}
              </h2>
              <button
                onClick={() => setShowModelPopup(false)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleModelSelect(model)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                      formData.model === model.slug
                        ? theme === 'dark'
                          ? 'border-purple-400 bg-purple-900/30 shadow-lg shadow-purple-500/20'
                          : 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-500/20'
                        : theme === 'dark'
                          ? 'border-gray-600 bg-gray-700/30 hover:border-gray-500 hover:bg-gray-700/50'
                          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {/* Model Thumbnail/Icon */}
                    <div className={`w-full h-32 rounded-lg mb-4 overflow-hidden ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      {model.thumbnail ? (
                        <img 
                          src={`${import.meta.env.VITE_STORAGE_BASE_URL || 'http://127.0.0.1:8001/storage'}/${model.thumbnail}`} 
                          alt={model.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center text-4xl ${
                        model.thumbnail ? 'hidden' : ''
                      }`}>
                        🎨
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className={`font-semibold text-lg ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {model.name}
                      </h3>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {model.platform}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          💎 {model.credit_price}
                        </span>
                      </div>
                      
                      <p className={`text-sm leading-relaxed ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {model.short_description}
                      </p>
                      
                      {formData.model === model.slug && (
                        <div className={`flex items-center space-x-2 text-sm font-medium ${
                          theme === 'dark' ? 'text-purple-400' : 'text-blue-600'
                        }`}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {t.imageCreator?.selected || 'Selected'}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-yellow-50 border-yellow-200 text-yellow-800'
        } ${
          theme === 'dark' ? (
            toast.type === 'success' ? 'dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' :
            toast.type === 'error' ? 'dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' :
            'dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'
          ) : ''
        }`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={closeToast}
              className={`flex-shrink-0 ml-2 p-1 rounded-md hover:bg-opacity-20 ${
                toast.type === 'success' ? 'hover:bg-green-500' :
                toast.type === 'error' ? 'hover:bg-red-500' :
                'hover:bg-yellow-500'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCreator;