import { authService } from './authService';

export interface ImageGenerationRequest {
  prompt: string;
  model: string;
  width: number;
  height: number;
  numberResults: number;
  imageStyle?: string;
  name?: string;
  share?: boolean;
}

export interface ImageGenerationResponse {
  success: boolean;
  data?: {
    id: number;
    status: string;
    images: string[];
    credit_cost: number;
    remaining_credits: number;
  };
  error?: string;
  generate_id?: number;
}

export interface GenerationStatusResponse {
  data: {
    id: number;
    status: string;
    name: string;
    created_at: string;
    credit_cost: number;
    images?: string[];
    error?: string;
  };
}

class ImageGenerationService {
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
   * Create image using backend endpoint
   */
  async createImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        // Show auth modal if callback is set
        if (this.onAuthRequired) {
          this.onAuthRequired();
        }
        throw new Error('Authentication required');
      }

      console.log('Calling backend create-image endpoint with request:', request);

      const response = await fetch(`${this.baseUrl}/images/create-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      console.log('Backend create-image response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error calling create-image endpoint:', error);
      throw error;
    }
  }

  /**
   * Get generation status
   */
  async getGenerationStatus(id: number): Promise<GenerationStatusResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        // Show auth modal if callback is set
        if (this.onAuthRequired) {
          this.onAuthRequired();
        }
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/images/generation/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting generation status:', error);
      throw error;
    }
  }

  /**
   * Validate request before sending
   */
  validateRequest(request: ImageGenerationRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    if (!request.model) {
      throw new Error('Model is required');
    }

    if (request.width < 256 || request.width > 1536) {
      throw new Error('Width must be between 256 and 1536 pixels');
    }

    if (request.height < 256 || request.height > 1536) {
      throw new Error('Height must be between 256 and 1536 pixels');
    }

    if (request.numberResults < 1 || request.numberResults > 4) {
      throw new Error('Number of results must be between 1 and 4');
    }
  }
}

export const imageGenerationService = new ImageGenerationService();