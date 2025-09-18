'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, isLoading } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: ''
  });

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const result = await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        avatar: formData.avatar.trim() || undefined
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || t.profile?.updateSuccess || 'Cập nhật thông tin thành công!' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: result.message || t.profile?.updateError || 'Có lỗi xảy ra khi cập nhật thông tin' });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage({ type: 'error', text: t.profile?.updateError || 'Có lỗi xảy ra khi cập nhật thông tin' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t.profile?.title || 'Thông tin cá nhân'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            {user.avatar || formData.avatar ? (
              <img
                src={isEditing ? formData.avatar : user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover mb-3"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-medium mb-3 ${
              (user.avatar || formData.avatar) ? 'hidden' : ''
            }`}>
              {getUserInitials(user.name)}
            </div>
            
            {isEditing && (
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.profile?.avatar || 'Avatar URL'}
                </label>
                <input
                  type="url"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* User Information */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.profile?.name || 'Họ và tên'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {user.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.profile?.email || 'Email'}
              </label>
              <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                {user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.profile?.emailNote || 'Email không thể thay đổi'}
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.profile?.phone || 'Số điện thoại'}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+84 xxx xxx xxx"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                {user.phone || t.profile?.notUpdated || 'Chưa cập nhật'}
              </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.profile?.role || 'Vai trò'}
              </label>
              <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                {user.role === 'admin' ? (t.profile?.admin || 'Quản trị viên') : (t.profile?.user || 'Người dùng')}
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.profile?.status || 'Trạng thái'}
              </label>
              <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {user.status === 'active' ? (t.profile?.active || 'Hoạt động') : (t.profile?.inactive || 'Không hoạt động')}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 disabled:opacity-50"
              >
                {t.common?.cancel || 'Hủy'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSaving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isSaving ? (t.profile?.saving || 'Đang lưu...') : (t.common?.save || 'Lưu')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                {t.common?.close || 'Đóng'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {t.common?.edit || 'Chỉnh sửa'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;