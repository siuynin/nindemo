import { authService } from './authService';

export interface OpenAITemplate {
  id: number;
  title: string;
  description?: string;
  prompt: string;
  type: string;
  active: boolean;
  premium: boolean;
  custom_template: boolean;
  tone_of_voice: boolean;
  questions?: any[];
  image?: string;
  color?: string;
  filters: string | string[];
  package?: string | string[];
  created_at: string;
  updated_at: string;
}

export interface OpenAITemplateResponse {
  success: boolean;
  data: OpenAITemplate[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

class OpenAIService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/openai-templates`;

  private async makeRequest(url: string, options: RequestInit = {}) {
    const token = authService.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        authService.logout();
        throw new Error('Unauthorized');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getTemplates(params?: {
    search?: string;
    filters?: string;
    category?: string;
    model?: string;
    active?: boolean;
    per_page?: number;
    page?: number;
  }): Promise<OpenAITemplateResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest(url);
  }

  async getTemplate(id: number): Promise<{ success: boolean; data: OpenAITemplate }> {
    return this.makeRequest(`${this.baseUrl}/${id}`);
  }

  async getFilterOptions(): Promise<{ success: boolean; data: { filters: string[]; categories: string[]; models: string[] } }> {
    return this.makeRequest(`${this.baseUrl}/filter-options`);
  }

  async getActiveTemplates(): Promise<OpenAITemplateResponse> {
    return this.getTemplates({ active: true });
  }

  async searchByFilters(filters: string[]): Promise<OpenAITemplateResponse> {
    const filterString = filters.join(',');
    return this.getTemplates({ filters: filterString });
  }
}

export const openaiService = new OpenAIService();
export default openaiService;