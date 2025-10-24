import { authService } from './authService';

export interface ImageToImageRequest {
  image: string; // Base64 encoded image
  prompt: string;
  ratio: string; // Aspect ratio: auto,1:1,2:3,3:2,3:4,4:3,4:5,5:4,9:16,16:9,21:9
  name?: string; // Optional name for the generation
  share?: boolean;
}

export interface ImageToImageResponse {
  success: boolean;
  data?: {
    id: number;
    status: string;
    images: string[];
    credit_cost: number;
    remaining_credits: number;
  };
  error?: string;
}

export interface TaskStatusResponse {
  success: boolean;
  data?: {
    status: string; // 'processing', 'completed', 'failed'
    generate_id: number;
    result_url?: string[];
    error?: string;
  };
  error?: string;
}

class ImageToImageService {
  private baseUrl: string;
  private onAuthRequired?: () => void;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
  }

  /**
   * Set callback function to show auth modal when authentication is required
   */
  setAuthRequiredCallback(callback: () => void) {
    this.onAuthRequired = callback;
  }

  /**
   * Convert image to image using backend endpoint
   */
  async generateImageToImage(request: ImageToImageRequest): Promise<ImageToImageResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        // Show auth modal if callback is set
        if (this.onAuthRequired) {
          this.onAuthRequired();
        }
        throw new Error('Authentication required');
      }

      console.log('Calling backend image-to-image endpoint with request:', request);

      const response = await fetch(`${this.baseUrl}/images/image-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      console.log('Backend image-to-image response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error calling image-to-image endpoint:', error);
      throw error;
    }
  }

  /**
   * Check task status for polling
   */
  async checkTaskStatus(generateId: number, taskId: string): Promise<TaskStatusResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Checking task status:', { generateId, taskId });

      const response = await fetch(`${this.baseUrl}/images/check-task-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          generate_id: generateId,
          task_id: taskId
        }),
      });

      const data = await response.json();
      console.log('Task status response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data: {
          status: data.status,
          generate_id: data.generate_id,
          result_url: data.result_url,
          error: data.error
        }
      };
    } catch (error) {
      console.error('Error checking task status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): void {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP images.');
    }

    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB.');
    }
  }

  /**
   * Validate request before sending
   */
  validateRequest(request: ImageToImageRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    if (!request.image) {
      throw new Error('Image is required');
    }

    if (!request.ratio) {
      throw new Error('Aspect ratio is required');
    }

    // Validate image format - accept both base64 and URLs
    if (!request.image.startsWith('data:image/') && !request.image.startsWith('http')) {
      throw new Error('Invalid image format. Please provide a valid image URL or base64 data.');
    }
  }
}

export const imageToImageService = new ImageToImageService();