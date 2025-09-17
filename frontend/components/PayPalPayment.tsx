import React, { useState } from 'react';
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

  // PayPal configuration
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || process.env.REACT_APP_PAYPAL_CLIENT_ID;
  
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
  const isSandbox = paypalClientId.startsWith('AeA1Q') || paypalClientId.includes('sandbox') || paypalClientId.includes('sb-');
  
  const initialOptions = {
    "client-id": paypalClientId,
    currency: plan.currency || "USD",
    intent: "capture",
    "data-sdk-integration-source": "react-paypal-js",
    "disable-funding": "credit,card",
    // Explicitly set environment
    ...(isSandbox ? {
      "data-client-token": undefined,
      "buyer-country": "US",
    } : {}),
  };
  
  // Add environment to options if sandbox
  if (isSandbox) {
    initialOptions.environment = 'sandbox';
  }

  const createOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert VND to USD if needed (approximate rate: 1 USD = 24,000 VND)
      const paymentCurrency = plan.currency === 'VND' ? 'USD' : (plan.currency || 'USD');
      const paymentAmount = plan.currency === 'VND' ? Math.ceil(plan.price / 24000) : plan.price;

      // Call your backend API to create PayPal order
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiBaseUrl}/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: paymentCurrency,
          plan_id: plan.id,
          return_url: window.location.origin + '/payment/success',
          cancel_url: window.location.origin + '/payment/cancel',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const orderData = await response.json();
      if (orderData.success && orderData.order_id) {
        // Store bill_id for later use in capture
        sessionStorage.setItem('paypal_bill_id', orderData.bill_id);
        return orderData.order_id;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message);
      onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      // Call your backend API to capture the payment
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiBaseUrl}/paypal/capture-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          order_id: data.orderID,
          bill_id: sessionStorage.getItem('paypal_bill_id'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to capture PayPal payment');
      }

      const details = await response.json();
      onSuccess(details);
    } catch (err: any) {
      setError(err.message);
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  const onErrorHandler = (err: any) => {
    setError('PayPal payment failed');
    onError(err);
  };

  const onCancelHandler = () => {
    setError(null);
    onCancel();
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
      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Đang xử lý...</span>
        </div>
      )}

      {/* PayPal Buttons */}
      {!loading && (
        <PayPalScriptProvider options={initialOptions}>
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'paypal',
            }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onErrorHandler}
            onCancel={onCancelHandler}
            disabled={loading}
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