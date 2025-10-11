import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyCredits?: () => void;
  requiredCredits?: number;
  currentCredits?: number;
  message?: string;
}

const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  onClose,
  onBuyCredits,
  requiredCredits,
  currentCredits,
  message
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const defaultMessage = requiredCredits && currentCredits !== undefined
    ? `Bạn cần ${requiredCredits} credit để thực hiện tác vụ này, nhưng chỉ có ${currentCredits} credit.`
    : 'Bạn không có đủ credit để thực hiện tác vụ này.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 p-6 rounded-lg shadow-xl ${
        theme === 'dark' 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Không đủ Credit
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-gray-100 ${
              theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className={`text-sm mb-4 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {message || defaultMessage}
          </p>
          
          {requiredCredits && currentCredits !== undefined && (
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Credit hiện tại:
                </span>
                <span className={`font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {currentCredits}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Credit cần thiết:
                </span>
                <span className="font-semibold text-red-600">
                  {requiredCredits}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Đóng
          </Button>
          {onBuyCredits && (
            <Button
              onClick={() => {
                navigate('/price');
                onClose();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Mua Credit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditModal;