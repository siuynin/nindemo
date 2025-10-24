import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { imageGenerationService, ImageGenerationRequest } from '../services/imageGenerationService';
import { imageToImageService, ImageToImageRequest } from '../services/imageToImageService';
import AIService from '../services/AIService';
import { generateService } from '../services/generateService'; 
import Button from '../components/ui/Button'; 
import TextArea from '../components/ui/TextArea';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import AuthModal from '../components/AuthModal';
import CreditModal from '../components/CreditModal';
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
  seed?: number; // Thêm seed từ Runware API
  prompt: string;
  model: string;
  width: number;
  height: number;
  createdAt: Date;
  generateId?: number; // Thêm ID từ bảng generates
  resultData?: any; // Dữ liệu từ result_url
  status?: 'processing' | 'completed' | 'failed'; // Thêm trạng thái
}

const ImageCreator: React.FC = () => {
  const { actualTheme } = useTheme();
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const [models, setModels] = useState<AIModel[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModelPopup, setShowModelPopup] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'text-to-image' | 'image-to-image'>('text-to-image');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    prompt: '',
    model: '',
    width: 1024,
    height: 1024,
    numberResults: 1,
    imageStyle: '' as string // Thêm field cho thể loại hình ảnh
  });

  // Ref to track active polling tasks to prevent duplicates
  const activePollingTasks = useRef<Set<string>>(new Set());

  // Hàm lấy aspect ratios phù hợp với model đã chọn
  const getAspectRatios = useCallback(() => {
    const isBytedanceModel = formData.model === 'bytedance:3@1';
    const isRunwareModel = formData.model === 'runware:106@1';
    const isGoogleModel = formData.model === 'google:2@1';
    const isBananaModel = formData.model === 'google:4@1';
    if (isBytedanceModel) {
      // Match đúng kích thước cho bytedance:3@1
      return [
        { label: '1:1 (Square)', width: 1024, height: 1024, ratio: '1:1' },
        { label: '3:4 (Portrait)', width: 864, height: 1152, ratio: '3:4' },
        { label: '4:3 (Standard)', width: 1152, height: 864, ratio: '4:3' },
        { label: '16:9 (Landscape)', width: 1280, height: 720, ratio: '16:9' },
        { label: '9:16 (Portrait)', width: 720, height: 1280, ratio: '9:16' },
        { label: '2:3 (Portrait)', width: 832, height: 1248, ratio: '2:3' },
        { label: '3:2 (Landscape)', width: 1248, height: 832, ratio: '3:2' },
        { label: '21:9 (Ultrawide)', width: 1512, height: 648, ratio: '21:9' }
      ];
    }
    if (isBananaModel) {
      // Match đúng kích thước cho bytedance:3@1
      return [
        { label: '1:1 (Square)', width: 1024, height: 1024, ratio: '1:1' },
        { label: '3:4 (Portrait)', width: 864, height: 1184, ratio: '3:4' },
        { label: '4:3 (Standard)', width: 1184, height: 864, ratio: '4:3' },
        { label: '16:9 (Landscape)', width: 1344, height: 768, ratio: '16:9' },
        { label: '9:16 (Portrait)', width: 768, height: 1344, ratio: '9:16' },
        { label: '2:3 (Portrait)', width: 832, height: 1248, ratio: '2:3' },
        { label: '3:2 (Landscape)', width: 1248, height: 832, ratio: '3:2' },
        { label: '21:9 (Ultrawide)', width: 1536, height: 674, ratio: '21:9' }
      ];
    }
    if (isRunwareModel) {
      // Match đúng kích thước cho runware:106@1
      return [
        { label: '21:9 Ultrawide (1568×672)', width: 1568, height: 672, ratio: '21:9' },
        { label: '19:9 Widescreen (1504×688)', width: 1504, height: 688, ratio: '19:9' },
        { label: '18:9 Standard (1456×720)', width: 1456, height: 720, ratio: '18:9' },
        { label: '17:9 Cinema (1392×752)', width: 1392, height: 752, ratio: '17:9' },
        { label: '4:3 HD (1328×800)', width: 1328, height: 800, ratio: '4:3' },
        { label: '15:9 Modern (1248×832)', width: 1248, height: 832, ratio: '15:9' },
        { label: '14:9 Traditional (1184×880)', width: 1184, height: 880, ratio: '14:9' },
        { label: '13:9 Classic (1104×944)', width: 1104, height: 944, ratio: '13:9' },
        { label: '1:1 Square (1024×1024)', width: 1024, height: 1024, ratio: '1:1' },
        { label: '9:13 Portrait (944×1104)', width: 944, height: 1104, ratio: '9:13' },
        { label: '9:14 Portrait (880×1184)', width: 880, height: 1184, ratio: '9:14' },
        { label: '9:15 Portrait (832×1248)', width: 832, height: 1248, ratio: '9:15' },
        { label: '9:16 Full Portrait (800×1328)', width: 800, height: 1328, ratio: '9:16' }
      ];
    }
    
    if (isGoogleModel) {
      // Match đúng kích thước cho google:2@1
      return [
        { label: '1:1 (Square)', width: 2048, height: 2048, ratio: '1:1' },
        { label: '9:16 (Portrait)', width: 1536, height: 2816, ratio: '9:16' },
        { label: '16:9 (Landscape)', width: 2816, height: 1536, ratio: '16:9' },
        { label: '3:4 (Portrait)', width: 1792, height: 2560, ratio: '3:4' },
        { label: '4:3 (Landscape)', width: 2560, height: 1792, ratio: '4:3' }
      ];
    }
    
    // Các model khác dùng kích thước mặc định - tất cả đều là bội số của 64
    return [
      { label: '1:1 (Square)', width: 1024, height: 1024, ratio: '1:1' },
      { label: '3:4 (Portrait)', width: 896, height: 1152, ratio: '3:4' },
      { label: '4:3 (Standard)', width: 1152, height: 896, ratio: '4:3' },
      { label: '16:9 (Landscape)', width: 1216, height: 704, ratio: '16:9' },
      { label: '9:16 (Portrait)', width: 704, height: 1216, ratio: '9:16' },
      { label: '2:3 (Portrait)', width: 832, height: 1248, ratio: '2:3' },
      { label: '3:2 (Landscape)', width: 1248, height: 832, ratio: '3:2' },
      { label: '21:9 (Ultrawide)', width: 1344, height: 576, ratio: '21:9' }
    ];
  }, [formData.model]);

  const aspectRatios = getAspectRatios();

  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[0]);

  // Cập nhật aspect ratio khi model thay đổi
  useEffect(() => {
    const currentRatios = getAspectRatios();
    const currentRatio = selectedAspectRatio.ratio;
    
    // Tìm ratio tương ứng trong danh sách mới
    const newRatio = currentRatios.find(ratio => ratio.ratio === currentRatio);
    
    if (newRatio) {
      // Nếu tìm thấy ratio tương ứng, giữ nguyên ratio nhưng cập nhật kích thước
      setSelectedAspectRatio(newRatio);
      setFormData(prev => ({
        ...prev,
        width: newRatio.width,
        height: newRatio.height
      }));
    } else {
      // Nếu không tìm thấy, chọn ratio đầu tiên trong danh sách mới
      setSelectedAspectRatio(currentRatios[0]);
      setFormData(prev => ({
        ...prev,
        width: currentRatios[0].width,
        height: currentRatios[0].height
      }));
    }
  }, [formData.model, getAspectRatios]);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditModalData, setCreditModalData] = useState<{
    requiredCredits?: number;
    currentCredits?: number;
    message?: string;
  }>({});

  useEffect(() => {
    fetchModels();
    fetchGeneratedImages(); // Tải ảnh từ database khi component mount
    
    // Xử lý URL parameters để lấy prompt từ Document page
    const urlParams = new URLSearchParams(window.location.search);
    const promptFromUrl = urlParams.get('prompt');
    if (promptFromUrl) {
      setFormData(prev => ({ ...prev, prompt: promptFromUrl }));
    }
  }, []);

  // Set up AIService toast callback
  useEffect(() => {
    AIService.setToastCallback((message: string, type: 'success' | 'error' | 'warning') => {
      showToast(type, message);
    });
  }, []);

  // Set up auth required callback for imageGenerationService
  useEffect(() => {
    imageGenerationService.setAuthRequiredCallback(() => {
      setShowAuthModal(true);
    });
  }, []);

  // Set up auth required callback for imageToImageService
  useEffect(() => {
    imageToImageService.setAuthRequiredCallback(() => {
      setShowAuthModal(true);
    });
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/models?type=image`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setModels(data.data);
          // Set default model if none selected
          if (!formData.model && data.data.length > 0) {
            setFormData(prev => ({ ...prev, model: data.data[0].slug }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  // Tải ảnh đã tạo từ database
  const fetchGeneratedImages = async () => {
    try {
      const response = await generateService.getGenerates({
        type: 'image',
        per_page: 24, // Giới hạn tối đa 24 ảnh
        page: 1
      });
      
      if (response.success && response.data) {
        const images: GeneratedImage[] = response.data.flatMap(generate => {
          let imageData: Array<{seed: number, url: string}> = [];
          let contentData = null;
          let filePatchData = null;
          
          // Parse result_url để lấy array các object {seed, url} từ Runware
          if (generate.result_url) {
            try {
              const resultData = JSON.parse(generate.result_url);
              // result_url giờ đây chứa array các object {seed, url}
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
          
          // Parse file_patch để lấy thông tin bổ sung
          if (generate.file_patch) {
            try {
              filePatchData = JSON.parse(generate.file_patch);
            } catch (parseError) {
              console.error('Error parsing file_patch:', parseError);
            }
          }
          
          // Nếu có imageData (ảnh đã hoàn thành), tạo GeneratedImage cho mỗi ảnh
          if (imageData.length > 0) {
            return imageData.map((imageItem, index) => ({
              id: `${generate.id}-${index}`,
              url: imageItem.url,
              seed: imageItem.seed,
              prompt: contentData?.prompt || generate.name || '',
              model: contentData?.model || 'Unknown',
              width: contentData?.width || 1024,
              height: contentData?.height || 1024,
              createdAt: new Date(generate.created_at),
              generateId: generate.id,
              resultData: filePatchData,
              status: 'completed' as const
            }));
          } else {
            // Nếu không có imageData, có thể là ảnh đang processing
            // Kiểm tra xem có task_id trong file_patch không
            const hasTaskId = filePatchData && filePatchData.task_id;
            
            if (hasTaskId) {
              // Ảnh đang processing
              return [{
                id: `processing-${generate.id}`,
                url: '', // Không có URL cho ảnh đang processing
                prompt: contentData?.prompt || generate.name || '',
                model: contentData?.model || 'Unknown',
                width: contentData?.width || 1024,
                height: contentData?.height || 1024,
                createdAt: new Date(generate.created_at),
                generateId: generate.id,
                resultData: filePatchData,
                status: 'processing' as const
              }];
            }
            
            // Nếu không có task_id và không có imageData, có thể là ảnh failed
            return [{
              id: `failed-${generate.id}`,
              url: '',
              prompt: contentData?.prompt || generate.name || '',
              model: contentData?.model || 'Unknown',
              width: contentData?.width || 1024,
              height: contentData?.height || 1024,
              createdAt: new Date(generate.created_at),
              generateId: generate.id,
              resultData: filePatchData,
              status: 'failed' as const
            }];
          }
        }).filter(img => img !== null); // Lọc ra các item null
        
        setGeneratedImages(images);
      }
    } catch (error) {
      console.error('Error fetching generated images:', error);
    }
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Polling mechanism để kiểm tra task status
  const startTaskStatusPolling = useCallback(async (generateId: number, taskId: string) => {
    const maxAttempts = 20; // Tối đa 20 lần kiểm tra (10 phút)
    const pollInterval = 30000; // 30 giây mỗi lần
    let attempts = 0;

    // Prevent duplicate polling for the same task
    const pollingKey = `${generateId}-${taskId}`;
    if (activePollingTasks.current.has(pollingKey)) {
      console.log('Polling already active for task:', pollingKey);
      return;
    }
    
    activePollingTasks.current.add(pollingKey);

    const pollTaskStatus = async () => {
      try {
        attempts++;
        console.log(`Polling task status (attempt ${attempts}/${maxAttempts}):`, { generateId, taskId });

        const response = await imageToImageService.checkTaskStatus(generateId, taskId);
        
        if (response.success && response.data) {
          const { status } = response.data;
          
          if (status === 'completed') {
            // Task completed - update the processing image to completed
            setGeneratedImages(prev => prev.map(img => 
              img.generateId === generateId && img.status === 'processing'
                ? { ...img, status: 'completed' as const }
                : img
            ));
            
            // Refresh images to get the actual image URLs
            await fetchGeneratedImages();
            await refreshUser();
            showToast('success', 'Ảnh đã được tạo thành công và đã được lưu vào thư viện!');
            
            // Remove from active polling tasks
            activePollingTasks.current.delete(pollingKey);
            return; // Stop polling
            
          } else if (status === 'failed') {
            // Task failed - update the processing image to failed
            setGeneratedImages(prev => prev.map(img => 
              img.generateId === generateId && img.status === 'processing'
                ? { ...img, status: 'failed' as const }
                : img
            ));
            
            showToast('error', 'Tạo ảnh thất bại. Vui lòng thử lại.');
            await refreshUser(); // Refresh to show refunded credits if any
            
            // Remove from active polling tasks
            activePollingTasks.current.delete(pollingKey);
            return; // Stop polling
            
          } else if (status === 'processing' && attempts < maxAttempts) {
            // Still processing - continue polling
            setTimeout(pollTaskStatus, pollInterval);
            return;
          }
        }
        
        // If we reach here, either max attempts reached or unknown status
        if (attempts >= maxAttempts) {
          // Update processing image to failed after timeout
          setGeneratedImages(prev => prev.map(img => 
            img.generateId === generateId && img.status === 'processing'
              ? { ...img, status: 'failed' as const }
              : img
          ));
          
          showToast('warning', 'Việc tạo ảnh đang mất nhiều thời gian hơn dự kiến. Sẽ cập nhật kết qủa sau.');
          
          // Remove from active polling tasks
          activePollingTasks.current.delete(pollingKey);
        }
        
      } catch (error) {
        console.error('Error polling task status:', error);
        if (attempts < maxAttempts) {
          // Continue polling on error (network issues, etc.)
          setTimeout(pollTaskStatus, pollInterval);
        } else {
          // Remove from active polling tasks on final failure
          activePollingTasks.current.delete(pollingKey);
        }
      }
    };

    // Start polling after a short delay
    setTimeout(pollTaskStatus, 5000); // Wait 5 seconds before first check
  }, [fetchGeneratedImages, refreshUser, showToast]);

  // Auto-start polling for processing images when component mounts or images change
  useEffect(() => {
    const processingImages = generatedImages.filter(img => img.status === 'processing');
    
    processingImages.forEach(img => {
      if (img.generateId && img.resultData?.task_id) {
        console.log('Auto-starting polling for processing image:', img.id, img.generateId, img.resultData.task_id);
        startTaskStatusPolling(img.generateId, img.resultData.task_id);
      }
    });
  }, [generatedImages, startTaskStatusPolling]);

  // Tối ưu hóa handleInputChange với useCallback
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberResults' ? parseInt(value) : value
    }));
  }, []);

  // Tối ưu hóa handleModelSelect với useCallback
  const handleModelSelect = useCallback((model: AIModel) => {
    setFormData(prev => ({ ...prev, model: model.slug }));
    setShowModelPopup(false);
  }, []);

  // Tối ưu hóa handleAspectRatioSelect với useCallback
  const handleAspectRatioSelect = useCallback((ratio: typeof aspectRatios[0]) => {
    setSelectedAspectRatio(ratio);
    setFormData(prev => ({
      ...prev,
      width: ratio.width,
      height: ratio.height
    }));
    setShowSizeDropdown(false);
  }, []);

  // Tối ưu hóa optimizePrompt với useCallback
  const optimizePrompt = useCallback(async () => {
    const currentPrompt = formData.prompt; // Lấy giá trị hiện tại
    if (!currentPrompt.trim()) {
      showToast('error', 'Please enter a prompt first');
      return;
    }

    try {
      const optimizedPrompt = await AIService.optimizePrompt(currentPrompt);
      setFormData(prev => ({ ...prev, prompt: optimizedPrompt }));
      showToast('success', 'Prompt optimized successfully!');
    } catch (error) {
      showToast('error', 'Failed to optimize prompt');
    }
  }, []); // Loại bỏ formData.prompt khỏi dependency để tránh re-render

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate image file
      imageToImageService.validateImageFile(file);
      
      // Convert to base64
      const base64Image = await imageToImageService.fileToBase64(file);
      setUploadedImage(base64Image);
      setUploadedImageFile(file);
      showToast('success', 'Image uploaded successfully!');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to upload image');
    }
  };

  const generateImageToImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prompt.trim()) {
      showToast('error', 'Please enter a prompt');
      return;
    }

    if (!uploadedImage) {
      showToast('error', 'Please upload an image');
      return;
    }

    setLoading(true);
    try {
      // Create request for image-to-image
      const request: ImageToImageRequest = {
        prompt: formData.prompt,
        image: uploadedImage,
        ratio: selectedAspectRatio.ratio,
        name: `Image-to-Image: ${formData.prompt.substring(0, 30)}${formData.prompt.length > 30 ? '...' : ''}`,
        share: false
      };

      // Validate request
      imageToImageService.validateRequest(request);

      console.log('Calling backend image-to-image endpoint with request:', request);
      
      // Call backend endpoint
      const response = await imageToImageService.generateImageToImage(request);
      
      if (response.success && response.data) {
        console.log('Image-to-image generation response:', response.data);
        
        if (response.data.status === 'completed' && response.data.images) {
          // Generation completed immediately
          await fetchGeneratedImages();
          await refreshUser();
          
          showToast('success', `Generated ${response.data.images.length} image(s) successfully! Deducted ${response.data.credit_cost} credits. Remaining: ${response.data.remaining_credits} credits.`);
          
        } else if (response.data.status === 'processing') {
          // Generation is processing in background (timeout occurred)
          await refreshUser(); // Refresh to show deducted credits
          
          // Add processing image to the gallery immediately
          const processingImage: GeneratedImage = {
            id: `processing-${response.data.id}`,
            url: '', // Empty URL for processing state
            prompt: formData.prompt,
            model: formData.model,
            width: selectedAspectRatio.width,
            height: selectedAspectRatio.height,
            createdAt: new Date(),
            generateId: response.data.id,
            status: 'processing'
          };
          
          setGeneratedImages(prev => [processingImage, ...prev]);
          
          showToast('info', response.data.message || 'Ảnh đang được tạo trong nền. Vui lòng kiểm tra lại sau ít phút.');
          
          // Start polling for task status
          if (response.data.task_id) {
            startTaskStatusPolling(response.data.id, response.data.task_id);
          }
          
        } else {
          // Other status or error
          showToast('error', response.data.error || 'Failed to generate image');
        }
      } else {
        console.log('Image-to-image generation failed:', response.error);
        showToast('error', response.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image-to-image:', error);
      if (error instanceof Error) {
        // Check if error is related to credit
        if (error.message.toLowerCase().includes('credit') || 
            error.message.toLowerCase().includes('insufficient') ||
            error.message.toLowerCase().includes('không đủ')) {
          // Show modal instead of toast for credit errors
          setCreditModalData({
            message: error.message
          });
          setShowCreditModal(true);
        } else {
          showToast('error', error.message);
        }
      } else {
        showToast('error', 'Failed to generate image. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Memoize selected model để tránh tính toán lại không cần thiết
  const selectedModel = useMemo(() => {
    // Ensure models is an array before calling find
    if (!Array.isArray(models)) {
      return null;
    }
    return models.find(model => model.slug === formData.model);
  }, [models, formData.model]);

  const getSelectedModel = useCallback(() => selectedModel, [selectedModel]);

  const generateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check which mode is active and delegate to appropriate function
    if (activeTab === 'image-to-image') {
      await generateImageToImage(e);
      return;
    }
    
    // Text-to-image mode (existing logic)
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
      // Tạo request cho backend
      const request: ImageGenerationRequest = {
        prompt: formData.prompt,
        model: formData.model,
        width: formData.width,
        height: formData.height,
        numberResults: formData.numberResults,
        imageStyle: formData.imageStyle,
        name: `Image: ${formData.prompt.substring(0, 30)}${formData.prompt.length > 30 ? '...' : ''}`,
        share: false
      };

      // Validate request
      imageGenerationService.validateRequest(request);

      console.log('Calling backend create-image endpoint with request:', request);
      
      // Gọi backend endpoint
      const response = await imageGenerationService.createImage(request);
      
      if (response.success && response.data) {
        console.log('Image generation successful:', response.data);
        
        // Refresh danh sách ảnh từ database sau khi tạo thành công
        // Chỉ cần gọi fetchGeneratedImages một lần để lấy dữ liệu mới nhất từ database
        await fetchGeneratedImages();
        
        // Làm mới số credit sau khi tạo ảnh thành công
        await refreshUser();
        
        showToast('success', `Generated ${response.data.images.length} image(s) successfully! Deducted ${response.data.credit_cost} credits. Remaining: ${response.data.remaining_credits} credits.`);
      } else {
        console.log('Image generation failed:', response.error);
        showToast('error', response.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      if (error instanceof Error) {
        // Kiểm tra nếu lỗi liên quan đến credit
        if (error.message.toLowerCase().includes('credit') || 
            error.message.toLowerCase().includes('insufficient') ||
            error.message.toLowerCase().includes('không đủ')) {
          // Hiển thị modal thay vì toast cho lỗi credit
          setCreditModalData({
            message: error.message
          });
          setShowCreditModal(true);
        } else {
          showToast('error', error.message);
        }
      } else {
        showToast('error', 'Failed to generate image. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const closeToast = () => {
    setToast(null);
  };



  // Hàm mở popup ảnh
  const openImagePopup = (image: GeneratedImage) => {
    setSelectedImage(image);
    setShowImagePopup(true);
  };

  // Hàm đóng popup ảnh
  const closeImagePopup = () => {
    setSelectedImage(null);
    setShowImagePopup(false);
  };

  // Hàm download ảnh
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      // Use a proxy approach to avoid CORS issues with external URLs
      const response = await fetch(imageUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'generated-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('success', 'Ảnh đã được tải xuống thành công!');
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback: open image in new tab if direct download fails
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('info', 'Ảnh đã được mở trong tab mới. Bạn có thể click chuột phải để lưu ảnh.');
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        showToast('error', 'Không thể tải xuống ảnh. Vui lòng thử lại sau.');
      }
    }
  };

  // Component LazyImage với lazy loading - Memoized để tránh re-render không cần thiết
  const LazyImage: React.FC<{ src: string; alt: string; className?: string; onClick?: () => void; isDark?: boolean }> = React.memo(({ 
    src, 
    alt, 
    className = '', 
    onClick,
    isDark = false
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
      // Reset loading state when src changes
      setIsLoaded(false);
      setIsInView(false);
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [src]); // Chỉ re-run khi src thay đổi

    return (
      <div ref={imgRef} className={`relative overflow-hidden ${className}`} onClick={onClick}>
        {!isLoaded && (
          <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`}>
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {isInView && (
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-300 hover:scale-105 cursor-pointer ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
          />
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function để chỉ re-render khi cần thiết
    return prevProps.src === nextProps.src && 
           prevProps.alt === nextProps.alt && 
           prevProps.className === nextProps.className &&
           prevProps.isDark === nextProps.isDark;
  });

  // Function to handle edit image
  const handleEditImage = useCallback(async (image: GeneratedImage) => {
    try {
      // Check if image has valid URL and is not in failed state
      if (!image.url || image.status === 'failed') {
        showToast('error', 'Cannot edit this image - no valid URL available');
        return;
      }

      // Switch to image-to-image tab
      setActiveTab('image-to-image');
      
      // Show loading toast
      showToast('info', 'Loading image for editing...');
      
      // For S3 URLs, use them directly without conversion to base64
      // The backend will handle URL validation and processing
      let imageData = image.url;
      
      // Only convert to base64 if it's already a data URL or if URL loading fails
      if (!image.url.startsWith('data:image/')) {
        // Check if it's an S3 URL - if so, use it directly
        if (image.url.includes('amazonaws.com') || image.url.includes('s3.')) {
          // Use S3 URL directly - backend will handle it
          imageData = image.url;
        } else {
          // For non-S3 URLs, try to convert to base64 as fallback
          try {
            const response = await fetch(image.url, {
              mode: 'cors',
              credentials: 'omit'
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              imageData = base64;
            } else {
              // If fetch fails, still try to use the URL directly
              console.warn('Failed to fetch image, using URL directly:', response.status);
              imageData = image.url;
            }
          } catch (fetchError) {
            // If conversion fails, use URL directly and let backend handle it
            console.warn('Failed to convert image to base64, using URL directly:', fetchError);
            imageData = image.url;
          }
        }
      }
      
      // Set the uploaded image
      setUploadedImage(imageData);
      
      // Create a File object for uploadedImageFile to enable the button
      // This is needed because the button disabled condition checks for uploadedImageFile
      try {
        let fileBlob: Blob;
        
        if (imageData.startsWith('data:image/')) {
          // Convert base64 to blob
          const response = await fetch(imageData);
          fileBlob = await response.blob();
        } else {
          // For URL, fetch the image
          const response = await fetch(imageData, { mode: 'cors' });
          fileBlob = await response.blob();
        }
        
        // Create File object from blob
        const file = new File([fileBlob], `edited-image-${Date.now()}.jpg`, { 
          type: fileBlob.type || 'image/jpeg' 
        });
        setUploadedImageFile(file);
      } catch (error) {
        console.warn('Could not create File object, using placeholder:', error);
        // Create a placeholder File object to enable the button
        const placeholderBlob = new Blob([''], { type: 'image/jpeg' });
        const placeholderFile = new File([placeholderBlob], `placeholder-${Date.now()}.jpg`, { 
          type: 'image/jpeg' 
        });
        setUploadedImageFile(placeholderFile);
      }
      
      // Set the prompt from the original image
      setFormData(prev => ({
        ...prev,
        prompt: image.prompt
      }));
      
      // Set aspect ratio based on image dimensions
      const imageRatio = image.width / image.height;
      let matchingRatio = aspectRatios.find(ratio => {
        const ratioValue = ratio.width / ratio.height;
        return Math.abs(ratioValue - imageRatio) < 0.1; // Allow small tolerance
      });
      
      if (matchingRatio) {
        setSelectedAspectRatio(matchingRatio);
        setFormData(prev => ({
          ...prev,
          width: matchingRatio.width,
          height: matchingRatio.height
        }));
      }
      
      // Scroll to top to show the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      showToast('success', 'Image loaded for editing!');
    } catch (error) {
      console.error('Error loading image for editing:', error);
      showToast('error', 'Failed to load image for editing. Please try again.');
    }
  }, [aspectRatios, showToast]);

  // Memoized ImageGallery component để tránh re-render khi form state thay đổi
  const ImageGallery: React.FC<{
    images: GeneratedImage[];
    isDark: boolean;
    onImageClick: (image: GeneratedImage) => void;
    onEditImage: (image: GeneratedImage) => void;
    t: any;
  }> = React.memo(({ images, isDark, onImageClick, onEditImage, t }) => {
    if (images.length === 0) {
      return (
        <div className="text-center py-16">
          <div className={`mx-auto w-32 h-32 ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'} rounded-2xl flex items-center justify-center mb-6 animate-pulse`}>
            <svg className={`w-16 h-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No images generated yet
          </h3>
          <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-md mx-auto leading-relaxed`}>
            Create your first AI-generated image by filling out the form and clicking "Generate Image"
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
        {images.map((image) => (
          <div 
            key={`${image.generateId}-${image.id}`} 
            className={`group relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-white hover:bg-gray-50'} cursor-pointer`}
            onClick={() => onImageClick(image)}
          >
            {/* Image Container */}
            <div className="aspect-square relative">
              {image.status === 'processing' ? (
                // Show processing state instead of image
                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Processing...
                    </p>
                  </div>
                </div>
              ) : (
                <LazyImage
                  src={image.url}
                  alt={image.prompt}
                  className="w-full h-full"
                  isDark={isDark}
                />
              )}
              {/* Overlay with image number */}
              <div className="absolute top-2 left-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-black/70 text-white' : 'bg-white/90 text-gray-700'} backdrop-blur-sm`}>
                  #{images.findIndex(img => img.id === image.id) + 1}
                </div>
              </div>  
              {/* Status badge */}
              {image.status && image.status !== 'completed' && (
                <div className="absolute top-2 right-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    image.status === 'processing' 
                      ? 'bg-blue-500 text-white' 
                      : image.status === 'failed'
                      ? 'bg-red-500 text-white'
                      : 'bg-green-500 text-white'
                  } backdrop-blur-sm`}>
                    {image.status === 'processing' ? 'Processing' : 
                     image.status === 'failed' ? 'Failed' : 'Completed'}
                  </div>
                </div>
              )}
              {/* Hover overlay with action buttons - only show for completed images */}
              {image.status !== 'processing' && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-3">
                    {/* View button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageClick(image);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors shadow-lg"
                      title="View Image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {/* Edit button (pencil icon) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditImage(image);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors shadow-lg"
                      title="Edit Image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Image Info */}
            <div className="p-3">
              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-2 mb-2`} title={image.prompt}>
                "{image.prompt}"
              </p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  
                  {image.seed && (
                    <span className={`px-2 py-1 rounded ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-600'}`}>
                      Seed: {image.seed}
                    </span>
                  )}
                </div>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {image.createdAt.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Chỉ re-render khi images array thay đổi hoặc isDark thay đổi
    return prevProps.images === nextProps.images && 
           prevProps.isDark === nextProps.isDark;
  });

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${actualTheme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
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
            }`}>{t.imageCreator.title}</h3> 
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
          {/* Form Section */}
          <div className="xl:col-span-4">
            <Card className=" backdrop-blur-sm sticky top-8" padding="lg" shadow="lg">
              <div className="flex items-center mb-3"> 
                <div>
                  <h2 className={`text-xl font-semibold text-gray-800 ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>{t.imageCreator?.createImage || 'Create Image'}</h2>
                 </div>
              </div>

              <form onSubmit={generateImage} className="space-y-6">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('text-to-image')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'text-to-image'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Text to Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('image-to-image')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'image-to-image'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Image to Image
                  </button>
                </div>

                {/* Image Upload for Image-to-Image */}
                {activeTab === 'image-to-image' && (
                  <div className="space-y-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Upload Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        {uploadedImage ? (
                          <img
                            src={uploadedImage}
                            alt="Uploaded"
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Click to upload an image
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              PNG, JPG, GIF up to 10MB
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* Prompt Section */}
                <div className="space-y-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {activeTab === 'image-to-image' ? 'Transformation Prompt' : 'Prompt'}
                  </label>
                  <div className="relative">
                    <TextArea
                      name="prompt"
                      value={formData.prompt}
                      onChange={handleInputChange}
                      placeholder={
                        activeTab === 'image-to-image' 
                          ? "Describe how you want to transform the image..."
                          : "Describe the image you want to create..."
                      }
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

                {/* Model Selection - Hidden in image-to-image mode */}
                {activeTab !== 'image-to-image' && (
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
                )}
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
                                ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100'
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

                

                {/* Number of Results Section - Hidden in image-to-image mode */}
                {activeTab !== 'image-to-image' && (
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
                )}

                {/* Generate Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !formData.prompt.trim() || !formData.model || (activeTab === 'image-to-image' && !uploadedImageFile)}
                    className="w-full h-11 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
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
                      : activeTab === 'image-to-image' 
                        ? 'Transform Image' 
                        : t.imageCreator?.generateImage || 'Generate Image'
                    }
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Generated Images Section */}
          <div className="xl:col-span-8">
            <Card className="  backdrop-blur-sm h-full" padding="lg" shadow="lg">
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
              
              <ImageGallery
                images={generatedImages}
                isDark={actualTheme === 'dark'}
                onImageClick={openImagePopup}
                onEditImage={handleEditImage}
                t={t}
              />
            </Card>
          </div>
        </div>
      </div>
      
      {/* Model Selection Modal */}
      <Modal
        isOpen={showModelPopup}
        onClose={() => setShowModelPopup(false)}
        title={t.imageCreator?.selectModel || 'Select AI Model'}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto px-4 py-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelSelect(model)}
              className={`p-2 border rounded-lg text-left transition-colors ${
                formData.model === model.slug
                  ? 'border-gray-400 bg-gray-100 dark:bg-gray-700/50 dark:border-gray-500'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                {model.thumbnail_url && (
                  <img
                    src={model.thumbnail_url}
                    alt={model.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {model.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {model.platform} • {Math.floor(model.credit_price)} credits
                  </p>
                  {model.short_description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-3">
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

      {/* Image Popup Modal */}
      <Modal
        isOpen={showImagePopup}
        onClose={closeImagePopup}
        title="Image Details"
        size="xl"
      >
        {selectedImage && (
          <div className="flex flex-col lg:flex-row gap-6 max-h-[90vh] overflow-hidden">
            {/* Image Section - Left Column */}
            <div className="lg:w-2/3 flex items-center justify-center">
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  className="max-h-[90vh] w-auto object-contain rounded-lg"
                />
              </div>
            </div>
            
            {/* Information Section - Right Column */}
            <div className="lg:w-1/3 flex flex-col space-y-4 overflow-y-auto">
              {/* Image Information */}
              <div className={`p-4 rounded-lg ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <h3 className={`font-medium mb-2 ${actualTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Prompt
                </h3>
                <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  "{selectedImage.prompt}"
                </p>
              </div>
              
              {/* Image Details */}
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h4 className={`text-xs font-medium ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Dimensions
                  </h4>
                  <p className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {selectedImage.width} × {selectedImage.height}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h4 className={`text-xs font-medium ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Created
                  </h4>
                  <p className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {selectedImage.createdAt.toLocaleDateString()}
                  </p>
                </div>
                {selectedImage.seed && (
                  <div className={`p-3 rounded-lg ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <h4 className={`text-xs font-medium ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                      Seed
                    </h4>
                    <p className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {selectedImage.seed}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 pt-4 mt-auto">
                <Button
                  variant="primary"
                  onClick={() => downloadImage(
                    selectedImage.url, 
                    `generated-image-${selectedImage.id}.jpg`
                  )}
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
                  onClick={closeImagePopup}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />

      {/* Credit Modal */}
      <CreditModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        message={creditModalData.message}
        requiredCredits={creditModalData.requiredCredits}
        currentCredits={creditModalData.currentCredits}
        onBuyCredits={() => {
          // Redirect to credit purchase page
          window.location.href = '/user-credit';
        }}
      />
    </div>
  );
};

export default ImageCreator;