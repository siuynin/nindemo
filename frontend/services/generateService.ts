import { authService } from './authService';

export interface Generate {
  id: number;
  user_id: number;
  name: string;
  content?: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  share: 'private' | 'public';
  file_patch?: string;
  task_id?: string;
  credit_cost: number;
  result_url?: string;
  error_message?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface GenerateResponse {
  success: boolean;
  data: Generate[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface GenerateStatistics {
  success: boolean;
  data: {
    total_generates: number;
    completed_generates: number;
    failed_generates: number;
    total_credit_cost: number;
    recent_generates: Generate[];
  };
}

export interface FetchOptions {
  showAuthModal?: () => void;
  onError?: (error: Error) => void;
  onLoading?: (loading: boolean) => void;
}

class GenerateService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/generates`;

  private async makeRequest(url: string, options: RequestInit = {}, fetchOptions?: FetchOptions) {
    try {
      if (fetchOptions?.onLoading) {
        fetchOptions.onLoading(true);
      }

      // Try to get token from both possible locations for backward compatibility
      let token = authService.getToken();
      if (!token) {
        token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      };

      const isSameOrigin = (() => {
        try {
          const requestOrigin = new URL(url).origin;
          return requestOrigin === window.location.origin;
        } catch {
          // If URL parsing fails, default to omit credentials to avoid CORS issues
          return false;
        }
      })();

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: isSameOrigin ? 'include' : 'omit',
      });

      // Handle non-JSON responses (e.g., HTML login page)
      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        if (response.status === 401) {
          // Clear both possible token locations
          authService.removeToken();
          localStorage.removeItem('token');
          
          if (fetchOptions?.showAuthModal) {
            fetchOptions.showAuthModal();
          } else {
            authService.logout();
          }
          throw new Error('Unauthorized - Please login again');
        }
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If we can't parse error response, use default message
        }
        throw new Error(errorMessage);
      }

      // If server returned HTML, treat as unauthorized/session issue
      if (contentType.includes('text/html')) {
        const text = await response.text();
        // Heuristics to detect login page or HTML response
        const looksLikeLogin = /<title>.*login.*<\/title>|name="password"|Auth::routes|<form[^>]*action=".*login"/i.test(text);
        if (looksLikeLogin) {
          authService.removeToken();
          localStorage.removeItem('token');
          if (fetchOptions?.showAuthModal) {
            fetchOptions.showAuthModal();
          } else {
            authService.logout();
          }
          throw new Error('Unauthorized - Redirected to login. Please authenticate.');
        }
        throw new Error('Unexpected HTML response from API');
      }

      // Parse JSON normally
      const data = await response.json();
      return data;
    } catch (error) {
      if (fetchOptions?.onError) {
        fetchOptions.onError(error as Error);
      }
      throw error;
    } finally {
      if (fetchOptions?.onLoading) {
        fetchOptions.onLoading(false);
      }
    }
  }

  async getGenerates(params?: {
    search?: string;
    type?: string;
    share?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  }, fetchOptions?: FetchOptions): Promise<GenerateResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest(url, {}, fetchOptions);
  }

  async getGenerate(id: number, fetchOptions?: FetchOptions): Promise<{ success: boolean; data: Generate }> {
    return this.makeRequest(`${this.baseUrl}/${id}`, {}, fetchOptions);
  }

  async createGenerate(data: {
    name: string;
    content?: string;
    type: string;
    status?: string;
    share?: string;
    file_patch?: string;
    task_id?: string;
    credit_cost?: number;
    result_url?: string;
    // NDHub TTS specific parameters
    lang?: string;
    voices?: string;
    audio_format?: string;
    speed?: number;
  }, fetchOptions?: FetchOptions): Promise<{ success: boolean; data: Generate; message: string }> {
    // For NDHub TTS, use specific endpoint
    if (data.type === 'audio' && data.lang && data.voices) {
      const ndhubUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/ndhub-tts`;
      return this.makeRequest(ndhubUrl, {
        method: 'POST',
        body: JSON.stringify(data),
      }, fetchOptions);
    }
    
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(data),
    }, fetchOptions);
  }

  async updateGenerate(id: number, data: Partial<{
    name: string;
    content: string;
    type: string;
    status: string;
    share: string;
    file_patch: string;
    task_id: string;
    credit_cost: number;
  }>, fetchOptions?: FetchOptions): Promise<{ success: boolean; data: Generate; message: string }> {
    return this.makeRequest(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, fetchOptions);
  }

  async deleteGenerate(id: number, fetchOptions?: FetchOptions): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    }, fetchOptions);
  }

  async getStatistics(fetchOptions?: FetchOptions): Promise<GenerateStatistics> {
    return this.makeRequest(`${this.baseUrl}/statistics`, {}, fetchOptions);
  }

  async getTypes(fetchOptions?: FetchOptions): Promise<{ success: boolean; data: string[] }> {
    return this.makeRequest(`${this.baseUrl}/types`, {}, fetchOptions);
  }

  // Method to get download URL with proper authentication
  getDownloadUrl(id: number): string {
    let token = authService.getToken();
    if (!token) {
      token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    }
    const baseUrl = `${this.baseUrl}/${id}/download`;
    return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
  }

  // Method to download audio file as blob
  async downloadGenerate(id: number, fetchOptions?: FetchOptions): Promise<Blob> {
    try {
      if (fetchOptions?.onLoading) {
        fetchOptions.onLoading(true);
      }

      let token = authService.getToken();
      if (!token) {
        token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      }
      
      const headers: Record<string, string> = {
        'Accept': 'audio/*,*/*',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      };

      const response = await fetch(`${this.baseUrl}/${id}/download`, {
        method: 'GET',
        headers,
        // No credentials for cross-origin downloads; use token-based auth
        credentials: 'omit',
      });

      if (!response.ok) {
        if (response.status === 401) {
          authService.removeToken();
          localStorage.removeItem('token');
          
          if (fetchOptions?.showAuthModal) {
            fetchOptions.showAuthModal();
          } else {
            authService.logout();
          }
          throw new Error('Unauthorized - Please login again');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.blob();
    } catch (error) {
      if (fetchOptions?.onError) {
        fetchOptions.onError(error as Error);
      }
      throw error;
    } finally {
      if (fetchOptions?.onLoading) {
        fetchOptions.onLoading(false);
      }
    }
  }
}

export const generateService = new GenerateService();
export default generateService;