interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  pricing_plan?: any;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    token_type: string;
  };
  errors?: any;
}

interface UserResponse {
  success: boolean;
  data: {
    user: User;
    total_credits?: number;
  };
}

class AuthService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  private tokenKey = 'auth_token';

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Set token in localStorage
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Remove token from localStorage
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Get authorization headers
  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Register new user
  async register(userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (data.success && data.data?.token) {
        this.setToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Login user
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      
      if (data.success && data.data?.token) {
        this.setToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Logout user
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        this.removeToken();
      }

      return data;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, remove token locally
      this.removeToken();
      return {
        success: true,
        message: 'Logged out locally'
      };
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<UserResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.status === 401) {
        // Token expired or invalid
        this.removeToken();
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(profileData: {
    name: string;
    phone?: string;
    avatar?: string;
    preferences?: any;
  }): Promise<{ success: boolean; message: string; data?: User }> {
    try {
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Update user password
  async updatePassword(passwordData: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/user/password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Reset password
  async resetPassword(resetData: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(resetData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export type { User, AuthResponse, UserResponse };