interface CreditResponse {
  success: boolean;
  message: string;
  data?: {
    total_credits: number;
    used_credits?: number;
    remaining_credits?: number;
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
        return creditInfo.data.total_credits >= requiredAmount;
      }
      return false;
    } catch (error) {
      console.error('Error checking credits:', error);
      return false;
    }
  }

  // Get user's current credit balance
  async getUserCredits(): Promise<CreditResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/user/credits`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user credits');
      }

      return data;
    } catch (error) {
      console.error('Get user credits error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Deduct credits from user account
  async deductCredits(request: DeductCreditRequest): Promise<DeductCreditResponse> {
    try {
      // First check if user has sufficient credits
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
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to deduct credits');
      }

      return data;
    } catch (error) {
      console.error('Deduct credits error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
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

  // Utility method to validate credit amount
  isValidCreditAmount(amount: number): boolean {
    return amount > 0 && Number.isFinite(amount) && amount <= 999999;
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