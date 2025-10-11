import { authService } from './authService';

export interface PricingPlan {
  id: number;
  name: string;
  description: string;
  price: number | string; // API có thể trả về string hoặc number
  currency: string;
  billing_cycle: string;
  duration_days?: number;
  max_voice_clone: number;
  features: number; // 0 or 1
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class PricingService {
  private baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = authService.getToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get all active pricing plans (public endpoint)
  async getPublicPricingPlans(): Promise<PricingPlan[]> {
    try {
      const response = await fetch(`${this.baseURL}/pricing-plans`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return (data.data?.pricing_plans || []).map((plan: PricingPlan) => ({
        ...plan,
        currency: plan.currency || 'VND'
      }));
    } catch (error) {
      console.error('Error fetching public pricing plans:', error);
      throw error;
    }
  }

  // Get all pricing plans (protected endpoint)
  async getAllPricingPlans(): Promise<PricingPlan[]> {
    try {
      const data = await this.makeRequest('/pricing-plans');
      return (data.data?.pricing_plans || []).map((plan: PricingPlan) => ({
        ...plan,
        currency: plan.currency || 'VND'
      }));
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      throw error;
    }
  }

  // Get specific pricing plan
  async getPricingPlan(id: number): Promise<PricingPlan> {
    try {
      const data = await this.makeRequest(`/pricing-plans/${id}`);
      return data.data;
    } catch (error) {
      console.error('Error fetching pricing plan:', error);
      throw error;
    }
  }

  // Create new pricing plan (admin only)
  async createPricingPlan(planData: Partial<PricingPlan>): Promise<PricingPlan> {
    try {
      const data = await this.makeRequest('/pricing-plans', {
        method: 'POST',
        body: JSON.stringify(planData),
      });
      return data.data;
    } catch (error) {
      console.error('Error creating pricing plan:', error);
      throw error;
    }
  }

  // Update pricing plan (admin only)
  async updatePricingPlan(id: number, planData: Partial<PricingPlan>): Promise<PricingPlan> {
    try {
      const data = await this.makeRequest(`/pricing-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(planData),
      });
      return data.data;
    } catch (error) {
      console.error('Error updating pricing plan:', error);
      throw error;
    }
  }

  // Delete pricing plan (admin only)
  async deletePricingPlan(id: number): Promise<void> {
    try {
      await this.makeRequest(`/pricing-plans/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
      throw error;
    }
  }
}

export const pricingService = new PricingService();