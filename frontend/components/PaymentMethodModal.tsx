import React, { useState } from 'react';
import { PricingPlan } from '../services/pricingService';
import PayPalPayment from './PayPalPayment';
import SePayPayment from './SePayPayment';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PricingPlan | null;
  onPaymentMethodSelect: (method: 'paypal' | 'bank_transfer') => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onPaymentMethodSelect
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'paypal' | 'bank_transfer' | null>(null);
  const [showPayPalPayment, setShowPayPalPayment] = useState(false);
  const [showSePayPayment, setShowSePayPayment] = useState(false);

  if (!isOpen || !selectedPlan) return null;

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
    }).format(price);
  };

  const handleConfirm = () => {
    if (selectedMethod === 'paypal') {
      setShowPayPalPayment(true);
    } else if (selectedMethod === 'bank_transfer') {
      setShowSePayPayment(true);
    }
  };

  const handlePayPalSuccess = (details: any) => {
    console.log('PayPal payment successful:', details);
    
    // Show success toast notification
    const successMessage = `Thanh toán thành công! 
    - Plan: ${details.plan_activated || 'N/A'}
    - Credits: ${details.credits_added || 0}
    - Transaction ID: ${details.transaction_id}`;
    
    // Create and show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm';
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <div class="font-semibold">Thanh toán thành công!</div>
          <div class="text-sm">Plan: ${details.plan_activated || 'N/A'}</div>
          <div class="text-sm">Credits: +${details.credits_added || 0}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
    
    onClose();
    
    // Reload page to update user plan and credits
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal payment error:', error);
    alert('Thanh toán thất bại. Vui lòng thử lại.');
  };

  const handlePayPalCancel = () => {
    setShowPayPalPayment(false);
  };

  const handleSePaySuccess = (details: any) => {
    console.log('SePay payment successful:', details);
    
    // Show success toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm';
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <div class="font-semibold">Thanh toán thành công!</div>
          <div class="text-sm">Order ID: ${details.orderId}</div>
          <div class="text-sm">Credits: +${details.credits_added || 0}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
    
    onClose();
    
    // Reload page to update user plan and credits
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleSePayError = (error: any) => {
    console.error('SePay payment error:', error);
    alert('Thanh toán thất bại. Vui lòng thử lại.');
  };

  const handleSePayCancel = () => {
    setShowSePayPayment(false);
  };

  const handleBackToMethods = () => {
    setShowPayPalPayment(false);
    setShowSePayPayment(false);
    setSelectedMethod(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {(showPayPalPayment || showSePayPayment) && (
                <button
                  onClick={handleBackToMethods}
                  className="mr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {showPayPalPayment ? 'Thanh toán PayPal' : showSePayPayment ? 'Thanh toán chuyển khoản' : 'Chọn phương thức thanh toán'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        {/* Content */}
        <div className="p-6">
          {showPayPalPayment ? (
            <PayPalPayment
              plan={selectedPlan}
              onSuccess={handlePayPalSuccess}
              onError={handlePayPalError}
              onCancel={handlePayPalCancel}
            />
          ) : showSePayPayment ? (
            <SePayPayment
              plan={selectedPlan}
              onSuccess={handleSePaySuccess}
              onError={handleSePayError}
              onCancel={handleSePayCancel}
            />
          ) : (
            <>
              {/* Plan Summary */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Gói đã chọn: {selectedPlan.name}
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    {selectedPlan.credits_included.toLocaleString()} credits
                  </span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(selectedPlan.price, selectedPlan.currency || 'VND')}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Chọn phương thức thanh toán:
              </h4>
          
              <div className="space-y-3">
                {/* PayPal Option */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedMethod === 'paypal' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={selectedMethod === 'paypal'}
                    onChange={() => setSelectedMethod('paypal')}
                    className="sr-only"
                  />
                  <div className="flex items-center w-full">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedMethod === 'paypal'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedMethod === 'paypal' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Credit Card / Debit Card
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Thanh toán qua PayPal (Visa, MasterCard, ...)
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-6" />
                        <div className="flex space-x-1">
                          <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                          <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Bank Transfer Option */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedMethod === 'bank_transfer' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={selectedMethod === 'bank_transfer'}
                    onChange={() => setSelectedMethod('bank_transfer')}
                    className="sr-only"
                  />
                  <div className="flex items-center w-full">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedMethod === 'bank_transfer'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedMethod === 'bank_transfer' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Chuyển khoản ngân hàng
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Chuyển khoản trực tiếp qua ngân hàng
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedMethod}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    selectedMethod
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Tiếp tục thanh toán
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;