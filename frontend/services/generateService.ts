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

class GenerateService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/generates`;

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

  async getGenerates(params?: {
    search?: string;
    type?: string;
    share?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  }): Promise<GenerateResponse> {
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

  async getGenerate(id: number): Promise<{ success: boolean; data: Generate }> {
    return this.makeRequest(`${this.baseUrl}/${id}`);
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
  }): Promise<{ success: boolean; data: Generate; message: string }> {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
  }>): Promise<{ success: boolean; data: Generate; message: string }> {
    return this.makeRequest(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGenerate(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  async getStatistics(): Promise<GenerateStatistics> {
    return this.makeRequest(`${this.baseUrl}/statistics`);
  }

  async getTypes(): Promise<{ success: boolean; data: string[] }> {
    return this.makeRequest(`${this.baseUrl}/types`);
  }

  // Method to get download URL with proper authentication
  getDownloadUrl(id: number): string {
    const token = authService.getToken();
    const baseUrl = `${this.baseUrl}/${id}/download`;
    return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
  }

  // Method to download audio file as blob
  async downloadGenerate(id: number): Promise<Blob> {
    const token = authService.getToken();
    
    const headers: Record<string, string> = {
      'Accept': 'audio/*,*/*',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const response = await fetch(`${this.baseUrl}/${id}/download`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        authService.logout();
        throw new Error('Unauthorized');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }
}

export const generateService = new GenerateService();
export default generateService;