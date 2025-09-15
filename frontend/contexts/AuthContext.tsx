'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User, UserResponse } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  totalCredits: number;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateProfile: (profileData: {
    name: string;
    phone?: string;
    avatar?: string;
    preferences?: any;
  }) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCredits, setTotalCredits] = useState(0);

  const isAuthenticated = !!user && authService.isAuthenticated();

  // Load user data on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      
      if (!authService.isAuthenticated()) {
        setUser(null);
        setTotalCredits(0);
        return;
      }

      const response = await authService.getCurrentUser();
      
      if (response && response.success) {
        setUser(response.data.user);
        setTotalCredits(response.data.total_credits || 0);
      } else {
        // Token might be expired or invalid
        setUser(null);
        setTotalCredits(0);
        authService.removeToken();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
      setTotalCredits(0);
      authService.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setTotalCredits(0); // Will be loaded by refreshUser
        await refreshUser();
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Đã xảy ra lỗi khi đăng nhập' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setTotalCredits(0); // Will be loaded by refreshUser
        await refreshUser();
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Đã xảy ra lỗi khi đăng ký' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      setIsLoading(true);
      const response = await authService.loginWithGoogle({ credential });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setTotalCredits(0); // Will be loaded by refreshUser
        await refreshUser();
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, message: 'Đã xảy ra lỗi khi đăng nhập với Google' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setTotalCredits(0);
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: {
    name: string;
    phone?: string;
    avatar?: string;
    preferences?: any;
  }) => {
    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Đã xảy ra lỗi khi cập nhật thông tin' };
    }
  };

  const refreshUser = async () => {
    if (!authService.isAuthenticated()) {
      return;
    }

    try {
      const response = await authService.getCurrentUser();
      
      if (response && response.success) {
        setUser(response.data.user);
        setTotalCredits(response.data.total_credits || 0);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    totalCredits,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;