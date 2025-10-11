interface CreditResponse {
  success: boolean;
  message: string;
  data?: {
    credits: Array<{
      id: number;
      user_id: number;
      pricing_plan_id?: number;
      total_credits: number;
      used_credits: number;
      remaining_credits: number;
      expires_at?: string;
      credit_type: 'free' | 'purchased' | 'bonus';
      created_at: string;
      updated_at: string;
    }>;
    total_remaining: number | string; // Backend có thể trả về string hoặc number
  };
  errors?: any;
}

interface DeductCreditRequest {
  amount: number;
  description?: string;
  model_id?: number;
  operation_type?: string;
}

interface DeductCreditResponse {
  success: boolean;
  message: string;
  data?: {
    deducted_amount: number;
    remaining_credits: number;
    transaction_id?: number;
  };
  errors?: any;
}

interface CreditTransaction {
  id: number;
  user_id: number;
  amount: number;
  type: 'deduct' | 'add' | 'refund';
  description: string;
  model_id?: number;
  operation_type?: string;
  created_at: string;
  updated_at: string;
}

interface CreditHistoryResponse {
  success: boolean;
  data?: {
    transactions: CreditTransaction[];
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
  errors?: any;
}

class UserCreditService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
  private tokenKey = 'auth_token';
  private creditCache: CreditResponse | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastFetch = 0;

  // Get stored token
  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get authorization headers
  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Check if user has sufficient credits
  async checkSufficientCredits(requiredAmount: number): Promise<boolean> {
    try {
      const creditInfo = await this.getUserCredits();
      if (creditInfo.success && creditInfo.data) {
        return creditInfo.data.total_remaining >= requiredAmount;
      }
      return false;
    } catch (error) {
      console.error('Error checking credits:', error);
      return false;
    }
  }

  // Get user's current credit balance
  async getUserCredits(useCache: boolean = true): Promise<CreditResponse> {
    try {
      // Check cache validity
      const now = Date.now();
      if (useCache && this.creditCache && (now - this.lastFetch) < this.cacheExpiry) {
        console.log('Using cached credits:', this.creditCache.data?.total_remaining);
        return this.creditCache;
      }

      const response = await fetch(`${this.baseUrl}/user/credits`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.error('Unauthorized access - clearing token and redirecting to login');
        localStorage.removeItem(this.tokenKey);
        // Dispatch custom event for auth required
        window.dispatchEvent(new CustomEvent('auth-required'));
        return {
          success: false,
          message: 'Authentication required - please login again',
        };
      }

      const data = await response.json();
      console.log('Credit API Response:', data); // Debug log
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to fetch user credits`);
      }

      // Validate response structure
      if (!data.success || !data.data) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response format from credits API');
      }

      // Convert total_remaining to number if it's a string
      let totalRemaining: number;
      if (typeof data.data.total_remaining === 'string') {
        totalRemaining = parseFloat(data.data.total_remaining);
        if (isNaN(totalRemaining)) {
          console.error('Invalid total_remaining value:', data.data.total_remaining);
          throw new Error('Invalid total_remaining format from credits API');
        }
        // Update the data object with the parsed number
        data.data.total_remaining = totalRemaining;
      } else if (typeof data.data.total_remaining === 'number') {
        totalRemaining = data.data.total_remaining;
      } else {
        console.error('Invalid total_remaining type:', typeof data.data.total_remaining);
        throw new Error('Invalid total_remaining format from credits API');
      }

      // Update cache
      this.creditCache = data;
      this.lastFetch = now;

      return data;
    } catch (error) {
      console.error('Get user credits error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            message: 'Request timeout - please check your connection',
          };
        }
        return {
          success: false,
          message: error.message,
        };
      }
      
      return {
        success: false,
        message: 'Unknown error occurred while fetching credits',
      };
    }
  }

  // Deduct credits from user account
  async deductCredits(request: DeductCreditRequest): Promise<DeductCreditResponse> {
    try {
      // Validate request
      if (!this.isValidCreditAmount(request.amount)) {
        return {
          success: false,
          message: 'Invalid credit amount provided',
        };
      }

      // First check if user has sufficient credits (force refresh cache)
      const hasSufficientCredits = await this.checkSufficientCredits(request.amount);
      if (!hasSufficientCredits) {
        return {
          success: false,
          message: 'Insufficient credits. Please purchase more credits to continue.',
        };
      }

      const response = await fetch(`${this.baseUrl}/user/credits/deduct`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000), // 15 second timeout for deduction
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.error('Unauthorized access - clearing token and redirecting to login');
        localStorage.removeItem(this.tokenKey);
        // Dispatch custom event for auth required
        window.dispatchEvent(new CustomEvent('auth-required'));
        return {
          success: false,
          message: 'Authentication required - please login again',
        };
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to deduct credits`);
      }

      // Clear cache after successful deduction to force refresh next time
      this.creditCache = null;

      return data;
    } catch (error) {
      console.error('Deduct credits error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            message: 'Request timeout - please check your connection and try again',
          };
        }
        return {
          success: false,
          message: error.message,
        };
      }
      
      return {
        success: false,
        message: 'Unknown error occurred while deducting credits',
      };
    }
  }

  // Get credit transaction history
  async getCreditHistory(page: number = 1, perPage: number = 20): Promise<CreditHistoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/user/credits/history?page=${page}&per_page=${perPage}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch credit history');
      }

      return data;
    } catch (error) {
      console.error('Get credit history error:', error);
      return {
        success: false,
        errors: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Add credits to user account (for admin or payment completion)
  async addCredits(amount: number, description: string = 'Credits added'): Promise<DeductCreditResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/user/credits/add`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          amount,
          description,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add credits');
      }

      return data;
    } catch (error) {
      console.error('Add credits error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Refund credits (for failed operations)
  async refundCredits(amount: number, description: string = 'Credits refunded'): Promise<DeductCreditResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/user/credits/refund`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          amount,
          description,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to refund credits');
      }

      return data;
    } catch (error) {
      console.error('Refund credits error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Utility method to format credit amount for display
  formatCredits(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  }

  // Clear credit cache (useful after payment or manual refresh)
  clearCache(): void {
    this.creditCache = null;
    this.lastFetch = 0;
  }

  // Get detailed credit info for display
  getCreditDisplayInfo(creditData: CreditResponse['data']) {
    if (!creditData) return null;

    const { credits, total_remaining } = creditData;
    
    // Group credits by type
    const byType = credits.reduce((acc, credit) => {
      if (!acc[credit.credit_type]) {
        acc[credit.credit_type] = { count: 0, total: 0 };
      }
      acc[credit.credit_type].count++;
      acc[credit.credit_type].total += credit.remaining_credits;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Check for expiring credits
    const now = new Date();
    const expiringSoon = credits.filter(credit => {
      if (!credit.expires_at) return false;
      const expires = new Date(credit.expires_at);
      const daysUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 7; // Expiring within 7 days
    });

    return {
      totalRemaining: total_remaining,
      byType,
      expiringSoon: expiringSoon.length,
      expiringCredits: expiringSoon,
      hasCredits: total_remaining > 0,
      creditTypes: Object.keys(byType),
    };
  }

  // Utility method to validate credit amount
  isValidCreditAmount(amount: number): boolean {
    return amount > 0 && Number.isFinite(amount) && amount <= 999999;
  }

  // Activate free plan
  async activateFreePlan(planId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/pricing-plans/${planId}/activate-free`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.error('Unauthorized access - clearing token and redirecting to login');
        localStorage.removeItem(this.tokenKey);
        window.dispatchEvent(new CustomEvent('auth-required'));
        return {
          success: false,
          message: 'Authentication required - please login again',
        };
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to activate free plan`);
      }

      // Clear cache to force refresh
      this.clearCache();

      return {
        success: true,
        message: data.message || 'Free plan activated successfully',
      };
    } catch (error) {
      console.error('Error activating free plan:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to activate free plan',
      };
    }
  }
}

// Export singleton instance
export const userCreditService = new UserCreditService();
export default userCreditService;

// Export types for use in components
export type {
  CreditResponse,
  DeductCreditRequest,
  DeductCreditResponse,
  CreditTransaction,
  CreditHistoryResponse,
};