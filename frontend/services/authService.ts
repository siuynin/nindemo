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
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
  private tokenKey = 'auth_token';
  private tokenExpiryKey = 'auth_token_expiry';
  private refreshTokenKey = 'refresh_token';

  // Get stored token
  getToken(): string | null {
    // Do not enforce client-side expiry for Sanctum personal access tokens
    return localStorage.getItem(this.tokenKey);
  }

  // Set token in localStorage
  setToken(token: string, _expiresIn?: number): void {
    // Store only the token; backend controls validity
    localStorage.setItem(this.tokenKey, token);
  }

  // Set refresh token
  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Remove all tokens from localStorage
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.tokenExpiryKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  // Check if user is authenticated with valid token
  isAuthenticated(): boolean {
    const token = this.getToken(); // This already checks expiry
    return !!token;
  }

  // Token expiry check disabled (Sanctum tokens typically don't expire client-side)
  isTokenExpiringSoon(): boolean {
    return false;
  }

  // Refresh access token using refresh token
  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.data?.token) {
        this.setToken(data.data.token, data.data.expires_in);
        if (data.data.refresh_token) {
          this.setRefreshToken(data.data.refresh_token);
        }
        return true;
      } else {
        this.removeToken();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.removeToken();
      return false;
    }
  }

  // Get authorization headers with auto-refresh
  private async getAuthHeaders(): Promise<HeadersInit> {
    let token = this.getToken();
    
    // Client-side expiry is disabled; skip refresh logic unless explicitly used
    // if (token && this.isTokenExpiringSoon()) {
    //   const refreshed = await this.refreshAccessToken();
    //   if (refreshed) {
    //     token = this.getToken();
    //   }
    // }
    
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
        this.setToken(data.data.token, data.data.expires_in);
        if (data.data.refresh_token) {
          this.setRefreshToken(data.data.refresh_token);
        }
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

  // Login with Google
  async loginWithGoogle(googleData: {
    credential: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(googleData)
      });

      const data = await response.json();
      
      if (data.success && data.data?.token) {
        this.setToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Google login error:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  // Logout user
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers
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
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers
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
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        method: 'PUT',
        headers,
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
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/user/password`, {
        method: 'PUT',
        headers,
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

// Export singleton instance and the class
export const authService = new AuthService();
export { AuthService };
export type { User, AuthResponse, UserResponse };