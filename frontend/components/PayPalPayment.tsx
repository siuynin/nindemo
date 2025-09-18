import React, { useState, useEffect, useRef } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { PricingPlan } from '../services/pricingService';

interface PayPalPaymentProps {
  plan: PricingPlan;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
}

const PayPalPayment: React.FC<PayPalPaymentProps> = ({
  plan,
  onSuccess,
  onError,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPayPalReady, setIsPayPalReady] = useState(false);
  const componentMounted = useRef(true);

  useEffect(() => {
    console.log('PayPal component mounted, plan:', plan);
    componentMounted.current = true;
    setIsPayPalReady(false);
    
    // Set PayPal ready after a short delay to ensure DOM is stable
    const timer = setTimeout(() => {
      if (componentMounted.current) {
        console.log('Setting PayPal ready to true');
        setIsPayPalReady(true);
      }
    }, 100);

    return () => {
      console.log('PayPal component unmounting');
      componentMounted.current = false;
      clearTimeout(timer);
    };
  }, [plan.id]);

  // PayPal configuration
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || process.env.REACT_APP_PAYPAL_CLIENT_ID;
  console.log('PayPal Client ID:', paypalClientId);
  
  // Validate PayPal Client ID
  if (!paypalClientId || paypalClientId === 'test') {
    console.error('PayPal Client ID is not configured properly');
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800 dark:text-red-200 font-medium">Cấu hình PayPal không hợp lệ</span>
        </div>
        <p className="text-red-700 dark:text-red-300 mt-1">PayPal Client ID chưa được cấu hình đúng cách.</p>
      </div>
    );
  }
  
  // Determine if this is a sandbox environment
  // Force sandbox for development - PayPal sandbox client IDs typically start with 'A' and are for testing
  const isSandbox = true; // Force sandbox for development
  
  const initialOptions = {
    "client-id": paypalClientId,
    currency: "USD",
    intent: "capture",
  };
  
  console.log('=== PayPal Debug Info ===');
  console.log('PayPal Client ID:', paypalClientId);
  console.log('PayPal initialOptions:', initialOptions);
  console.log('Is sandbox:', isSandbox);
  console.log('Loading state:', loading, 'PayPal ready:', isPayPalReady);
  console.log('Component mounted:', componentMounted.current);
  console.log('Plan details:', plan);

  const createOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication token
      const token = localStorage.getItem('auth_token');
      console.log('PayPal createOrder - Token exists:', !!token);
      
      if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện thanh toán');
      }

      // Convert VND to USD if needed (approximate rate: 1 USD = 24,000 VND)
      const paymentCurrency = plan.currency === 'VND' ? 'USD' : (plan.currency || 'USD');
      const paymentAmount = plan.currency === 'VND' ? Math.ceil(plan.price / 24000) : plan.price;

      // Call your backend API to create PayPal order
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
      console.log('PayPal createOrder - API URL:', `${apiBaseUrl}/paypal/create-order`);
      
      const response = await fetch(`${apiBaseUrl}/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: paymentCurrency,
          plan_id: plan.id,
          return_url: window.location.origin + '/payment/success',
          cancel_url: window.location.origin + '/payment/cancel',
        }),
      });

      console.log('PayPal createOrder - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PayPal createOrder - Error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (response.status === 403) {
          throw new Error('Bạn không có quyền thực hiện thanh toán này.');
        } else {
          throw new Error(`Lỗi tạo đơn hàng PayPal: ${response.status}`);
        }
      }

      const orderData = await response.json();
      console.log('PayPal createOrder - Response data:', orderData);
      
      if (orderData.success && orderData.order_id) {
        // Store bill_id for later use in capture
        sessionStorage.setItem('paypal_bill_id', orderData.bill_id);
        return orderData.order_id;
      } else {
        throw new Error(orderData.message || 'Phản hồi không hợp lệ từ server');
      }
    } catch (err: any) {
      if (componentMounted.current) {
        setError(err.message);
        onError(err);
      }
      throw err;
    } finally {
      if (componentMounted.current) {
        setLoading(false);
      }
    }
  };

  const onApprove = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication token
      const token = localStorage.getItem('auth_token');
      console.log('PayPal onApprove - Token exists:', !!token);
      
      if (!token) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      // Call your backend API to capture the payment
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
      console.log('PayPal onApprove - API URL:', `${apiBaseUrl}/paypal/capture-order`);
      
      const response = await fetch(`${apiBaseUrl}/paypal/capture-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: data.orderID,
          bill_id: sessionStorage.getItem('paypal_bill_id'),
        }),
      });

      console.log('PayPal onApprove - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PayPal onApprove - Error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (response.status === 403) {
          throw new Error('Bạn không có quyền thực hiện thanh toán này.');
        } else {
          throw new Error(`Lỗi xác nhận thanh toán PayPal: ${response.status}`);
        }
      }

      const details = await response.json();
      onSuccess(details);
    } catch (err: any) {
      if (componentMounted.current) {
        setError(err.message);
        onError(err);
      }
    } finally {
      if (componentMounted.current) {
        setLoading(false);
      }
    }
  };

  const onErrorHandler = (err: any) => {
    if (componentMounted.current) {
      setError('PayPal payment failed');
      onError(err);
    }
  };

  const onCancelHandler = () => {
    if (componentMounted.current) {
      setError(null);
      onCancel();
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800 dark:text-red-200 font-medium">Lỗi thanh toán</span>
        </div>
        <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plan Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Thanh toán gói: {plan.name}
        </h4>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">
            {plan.credits_included.toLocaleString()} credits
          </span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: plan.currency || 'VND',
            }).format(plan.price)}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {(loading || !isPayPalReady) && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {loading ? 'Đang xử lý...' : 'Đang tải PayPal...'}
          </span>
        </div>
      )}

      {/* PayPal Buttons */}
      {!loading && isPayPalReady && (
        <PayPalScriptProvider 
          options={initialOptions}
          onLoadStart={() => console.log('PayPal SDK loading started')}
          onLoadEnd={() => console.log('PayPal SDK loading ended')}
          onError={(err) => {
            console.error('PayPal SDK Error:', err);
            setError('Lỗi khởi tạo PayPal SDK: ' + (err.message || 'Không xác định'));
          }}
        >
          <PayPalButtons
            createOrder={createOrder}
            onApprove={onApprove}
            onError={(err) => {
              console.error('PayPal Buttons Error:', err);
              setError('Lỗi PayPal: ' + (err.message || 'Không xác định'));
              onError(err);
            }}
            onCancel={() => {
              console.log('PayPal payment cancelled');
              onCancel();
            }}
          />
        </PayPalScriptProvider>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>Thanh toán an toàn với PayPal</p>
        <p>Hỗ trợ Visa, MasterCard, và tài khoản PayPal</p>
      </div>
    </div>
  );
};

export default PayPalPayment;