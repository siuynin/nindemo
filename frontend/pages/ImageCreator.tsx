import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { runwareApi, RunwareImageResponse } from '../services/runwareApi';
import AIService from '../services/AIService';
import { generateService } from '../services/generateService';
import { userCreditService } from '../services/userCreditService';
import Button from '../components/ui/Button'; 
import TextArea from '../components/ui/TextArea';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
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
  const { actualTheme } = useTheme();
  const { t } = useLanguage();
  const [models, setModels] = useState<AIModel[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModelPopup, setShowModelPopup] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    prompt: '',
    model: '',
    width: 1024,
    height: 1024,
    numberResults: 1,
    imageStyle: '' as string // Thêm field cho thể loại hình ảnh
  });

  const aspectRatios = [
    { label: '1:1 (Square)', width: 1024, height: 1024, ratio: '1:1' },
    { label: '16:9 (Landscape)', width: 1920, height: 1080, ratio: '16:9' },
    { label: '9:16 (Portrait)', width: 1080, height: 1920, ratio: '9:16' },
    { label: '4:3 (Standard)', width: 1024, height: 768, ratio: '4:3' },
    { label: '3:4 (Portrait)', width: 768, height: 1024, ratio: '3:4' },
    { label: '21:9 (Ultrawide)', width: 1344, height: 576, ratio: '21:9' }
  ];

  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[0]);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  // Set up AIService toast callback
  useEffect(() => {
    AIService.setToastCallback((message: string, type: 'success' | 'error' | 'warning') => {
      showToast(type, message);
    });
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models/type/image');
      if (response.ok) {
        const result = await response.json();
        // API trả về format { success: true, data: [...] }
        const data = result.success && result.data ? result.data : result;
        // Ensure data is an array before setting models
        setModels(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch models:', response.status);
        setModels([]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberResults' ? parseInt(value) : value
    }));
  };

  const handleModelSelect = (model: AIModel) => {
    setFormData(prev => ({ ...prev, model: model.slug }));
    setShowModelPopup(false);
  };

  const handleAspectRatioSelect = (ratio: typeof aspectRatios[0]) => {
    setSelectedAspectRatio(ratio);
    setFormData(prev => ({
      ...prev,
      width: ratio.width,
      height: ratio.height
    }));
    setShowSizeDropdown(false);
  };

  const optimizePrompt = async () => {
    if (!formData.prompt.trim()) {
      showToast('error', 'Please enter a prompt first');
      return;
    }

    try {
      const optimizedPrompt = await AIService.optimizePrompt(formData.prompt);
      setFormData(prev => ({ ...prev, prompt: optimizedPrompt }));
      showToast('success', 'Prompt optimized successfully!');
    } catch (error) {
      showToast('error', 'Failed to optimize prompt');
    }
  };

  const generateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prompt.trim()) {
      showToast('error', 'Please enter a prompt');
      return;
    }

    if (!formData.model) {
      showToast('error', 'Please select a model');
      return;
    }

    setLoading(true);
    try {
      // Kiểm tra credit trước khi tạo ảnh
      console.log('Checking credits for model:', formData.model);
      let modelCreditResponse;
      try {
        modelCreditResponse = await fetch(`/api/models/${formData.model}/credit-price`);
        console.log('Model credit response status:', modelCreditResponse.status);
        if (!modelCreditResponse.ok) {
          console.error('Failed to fetch model credit price:', modelCreditResponse.statusText);
          throw new Error(`Failed to fetch model credit price: ${modelCreditResponse.status} ${modelCreditResponse.statusText}`);
        }
      } catch (fetchError) {
        console.error('Error fetching model credit price:', fetchError);
        if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to connect to backend API. Please check if the server is running.');
        }
        throw fetchError;
      }
      
      const creditData = await modelCreditResponse.json();
      console.log('Model credit data:', creditData);
      const creditPrice = creditData.credit_price || 0;
      const totalCreditsNeeded = creditPrice * formData.numberResults;
      console.log('Total credits needed:', totalCreditsNeeded, '(price:', creditPrice, 'x quantity:', formData.numberResults, ')');

      // Lấy credit hiện tại của người dùng
      console.log('Fetching user credits via userCreditService...');
      const userCreditResponse = await userCreditService.getUserCredits();
      console.log('User credit service response:', userCreditResponse);
      
      if (!userCreditResponse.success || !userCreditResponse.data) {
        console.error('Failed to get user credits:', userCreditResponse.message);
        throw new Error(`Failed to get user credits: ${userCreditResponse.message}`);
      }
      
      const currentCredits = userCreditResponse.data.total_credits || 0;
      console.log('Current user credits:', currentCredits);

      // Kiểm tra xem có đủ credit không
      if (currentCredits < totalCreditsNeeded) {
        showToast('error', `Insufficient credits. You need ${totalCreditsNeeded} credits but only have ${currentCredits} credits.`);
        setLoading(false);
        return;
      }
      
      console.log('Credit check passed:', currentCredits, '>=', totalCreditsNeeded);

      // Tạo prompt với imageStyle nếu có
      let finalPrompt = formData.prompt;
      if (formData.imageStyle) {
        const styleMap: { [key: string]: string } = {
          'realistic': 'realistic, photorealistic, high quality',
          'anime': 'anime style, manga style, japanese animation',
          'cinematic': 'cinematic, movie scene, dramatic lighting',
          'abstract': 'abstract art, artistic, creative',
          'pixel': 'pixel art, 8-bit style, retro gaming',
          'minimal': 'minimalist, clean, simple design'
        };
        const stylePrompt = styleMap[formData.imageStyle] || '';
        finalPrompt = `${formData.prompt}, ${stylePrompt}`;
      }

      const request: ImageGenerationRequest = {
        taskType: 'imageInference',
        taskUUID: `task_${Date.now()}`,
        positivePrompt: finalPrompt,
        width: formData.width,
        height: formData.height,
        model: formData.model,
        numberResults: formData.numberResults
      };

      // Kiểm tra API key trước khi gọi API
      const apiKey = import.meta.env.VITE_RUNWARE_API_KEY;
      console.log('Runware API Key configured:', !!apiKey);
      if (!apiKey || apiKey === 'your_runware_key_here') {
        throw new Error('Runware API key is not configured. Please add VITE_RUNWARE_API_KEY to your .env.local file.');
      }

      console.log('Calling runwareApi.generateImage with request:', request);
      let response;
      try {
        response = await runwareApi.generateImage(request);
        console.log('Runware API response:', response);
      } catch (apiError) {
        console.error('Runware API call failed:', apiError);
        if (apiError instanceof TypeError && apiError.message.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to connect to Runware API. Please check your internet connection and API configuration.');
        }
        throw apiError;
      }
      
      if (response.data && response.data.length > 0) {
        const newImages: GeneratedImage[] = response.data.map((img: RunwareImageResponse, index: number) => ({
          id: `${Date.now()}_${index}`,
          url: img.imageURL,
          prompt: formData.prompt,
          model: formData.model,
          width: formData.width,
          height: formData.height,
          createdAt: new Date()
        }));

        setGeneratedImages(prev => [...newImages, ...prev]);
        
        // Tạo generate record để lưu lịch sử sau khi tạo ảnh thành công
        try {
          const generateResponse = await generateService.createGenerate({
            name: `Image: ${formData.prompt.substring(0, 50)}${formData.prompt.length > 50 ? '...' : ''}`,
            content: formData.prompt,
            type: 'image',
            status: 'completed',
            model: formData.model,
            credit_cost: totalCreditsNeeded
          });
          console.log('Generate record created:', generateResponse);
        } catch (generateError) {
          console.error('Failed to create generate record:', generateError);
        }
        
        showToast('success', `Generated ${newImages.length} image(s) successfully!`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      showToast('error', 'Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const closeToast = () => {
    setToast(null);
  };

  const getSelectedModel = () => {
    // Ensure models is an array before calling find
    if (!Array.isArray(models)) {
      return null;
    }
    return models.find(model => model.slug === formData.model);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${actualTheme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]'}`}></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 ">
        {/* Header Section */}
        <div className={`p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-medium ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>{t.writeAssistant.title}</h3> 
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
          {/* Form Section */}
          <div className="xl:col-span-4">
            <Card className="shadow-2xl backdrop-blur-sm sticky top-8" padding="lg" shadow="lg">
              <div className="flex items-center mb-3"> 
                <div>
                  <h2 className={`text-xl font-semibold text-gray-800 ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>{t.imageCreator?.createImage || 'Create Image'}</h2>
                 </div>
              </div>

              <form onSubmit={generateImage} className="space-y-6">
                {/* Prompt Section */}
                <div className="space-y-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Prompt
                  </label>
                  <div className="relative">
                    <TextArea
                      name="prompt"
                      value={formData.prompt}
                      onChange={handleInputChange}
                      placeholder={t.imageCreator?.promptPlaceholder || "Describe the image you want to create..."}
                      rows={4}
                      className="w-full pr-12"
                    />
                    <button
                      type="button"
                      onClick={optimizePrompt}
                      title={t.imageCreator?.optimizePrompt || 'Optimize Prompt'}
                      className="absolute bottom-2 right-2 p-2 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    AI Model
                  </label>
                  <Button
                    type="button"
                    onClick={() => setShowModelPopup(true)}
                    variant="outline"
                    className="w-full justify-between"
                    endIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    }
                  >
                    {getSelectedModel()?.name || t.imageCreator?.selectModel || 'Select Model'}
                  </Button>
                </div>
                 
                {/* Image Style Selection */}
                <div className="space-y-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Thể loại hình ảnh
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'realistic', label: 'Thực tế' },
                      { id: 'anime', label: 'Anime' },
                      { id: 'cinematic', label: 'Điện ảnh' },
                      { id: 'abstract', label: 'Trừu tượng' },
                      { id: 'pixel', label: 'Pixel Art' },
                      { id: 'minimal', label: 'Tối giản' }
                    ].map((style) => (
                      <label
                        key={style.id}
                        className={`flex items-center justify-center p-1.5 rounded border cursor-pointer transition-colors text-xs ${
                          formData.imageStyle === style.id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="imageStyle"
                          value={style.id}
                          checked={formData.imageStyle === style.id}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              imageStyle: e.target.value
                            }));
                          }}
                          className="sr-only style-checkbox"
                        />
                        <span className="font-medium">
                          {style.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="space-y-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Image Size
                  </label>
                  <div className="relative">
                    <Button
                      type="button"
                      onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                      variant="outline"
                      className="w-full justify-between"
                      endIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      }
                    >
                      {selectedAspectRatio.label}
                    </Button>
                    
                    {showSizeDropdown && (
                      <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-lg z-10 ${actualTheme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                        {aspectRatios.map((ratio) => (
                          <button
                            key={ratio.ratio}
                            type="button"
                            onClick={() => handleAspectRatioSelect(ratio)}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                              selectedAspectRatio.ratio === ratio.ratio
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{ratio.label}</span>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-8 h-6 border-2 border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center bg-gray-100 dark:bg-gray-700"
                                  style={{
                                    aspectRatio: `${ratio.width}/${ratio.height}`,
                                    width: ratio.ratio === '1:1' ? '24px' : 
                                           ratio.ratio === '16:9' || ratio.ratio === '21:9' ? '32px' :
                                           ratio.ratio === '9:16' || ratio.ratio === '3:4' ? '16px' : '24px',
                                    height: ratio.ratio === '1:1' ? '24px' :
                                            ratio.ratio === '16:9' || ratio.ratio === '21:9' ? '18px' :
                                            ratio.ratio === '9:16' || ratio.ratio === '3:4' ? '28px' : '18px'
                                  }}
                                >
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {ratio.ratio}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Number of Results Section */}
                <div className="space-y-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Number of Images
                  </label>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center"> 
                      <span className="text-sm font-medium text-gray-800 dark:text-white">{formData.numberResults}</span>
                    </div>
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
                          actualTheme === 'dark' 
                            ? 'bg-gray-700 slider-thumb-dark' 
                            : 'bg-gray-200 slider-thumb-light'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !formData.prompt.trim() || !formData.model}
                    className="w-full h-11 text-sm font-medium"
                    size="md"
                    startIcon={
                      loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ maxWidth: '100%', height: 'auto' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )
                    }
                  >
                    {loading 
                      ? t.imageCreator?.generating || 'Generating...' 
                      : t.imageCreator?.generateImage || 'Generate Image'
                    }
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Generated Images Section */}
          <div className="xl:col-span-8">
            <Card className="shadow-2xl backdrop-blur-sm h-full" padding="lg" shadow="lg">
              <div className="flex items-center mb-8">
                <div className={`w-12 h-12 rounded-xl  ${actualTheme === 'dark' ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gradient-to-r from-green-600 to-blue-600'} flex items-center justify-center mr-4 shadow-lg`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-2xl font-bold text-gray-800 ${actualTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t.imageCreator?.generatedImages || 'Generated Images'}</h2>
                  <p className={`text-sm text-gray-500 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{t.imageCreator?.generatedImagesDescription || 'Your AI-created masterpieces appear here'}</p>
                </div>
              </div>
              
              {generatedImages.length === 0 ? (
                <div className="text-center py-16">
                  <div className={`mx-auto w-32 h-32 ${actualTheme === 'dark' ? 'bg-gradient-to-br from-gray-700 to-gray-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'} rounded-2xl flex items-center justify-center mb-6 animate-pulse`}>
                    <svg className={`w-16 h-16 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    No images generated yet
                  </h3>
                  <p className={`text-base ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} max-w-md mx-auto leading-relaxed`}>
                    Create your first AI-generated image by filling out the form and clicking "Generate Image"
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  {generatedImages.map((image, index) => (
                    <div key={image.id} className={`group border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${actualTheme === 'dark' ? 'border-gray-600 bg-gray-700/30 hover:border-gray-500' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'}`}>
                      <div className="relative overflow-hidden rounded-xl mb-4">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full transition-transform duration-300 group-hover:scale-105"
                          style={{ aspectRatio: `${image.width}/${image.height}` }}
                        />
                        <div className="absolute top-3 right-3">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${actualTheme === 'dark' ? 'bg-black/50 text-white' : 'bg-white/80 text-gray-700'} backdrop-blur-sm`}>
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className={`p-3 rounded-lg ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                          <p className="text-sm font-medium leading-relaxed" title={image.prompt}>
                            "{image.prompt}"
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 rounded-md text-xs font-medium ${actualTheme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                              {image.model}
                            </div>
                            <div className={`px-2 py-1 rounded-md text-xs font-medium ${actualTheme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-600'}`}>
                              {image.width}×{image.height}
                            </div>
                          </div>
                          <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {image.createdAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      
      {/* Model Selection Modal */}
      <Modal
        isOpen={showModelPopup}
        onClose={() => setShowModelPopup(false)}
        title={t.imageCreator?.selectModel || 'Select AI Model'}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelSelect(model)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                formData.model === model.slug
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                {model.thumbnail && (
                  <img
                    src={model.thumbnail}
                    alt={model.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {model.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {model.platform} • {model.credit_price} credits
                  </p>
                  {model.short_description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2">
                      {model.short_description}
                    </p>
                  )}
                </div>
                {formData.model === model.slug && (
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert
            variant={toast.type}
            message={toast.message}
            onClose={closeToast}
            showCloseButton={true}
          />
        </div>
      )}
    </div>
  );
};

export default ImageCreator;