import React, { useState, useEffect, useRef } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { PricingPlan } from '../services/pricingService';

interface PayPalPaymentProps {
  plan: PricingPlan;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
}

// PayPal Buttons Component - separated to use usePayPalScriptReducer
const PayPalButtonsWrapper: React.FC<{
  plan: PricingPlan;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
}> = ({ plan, onSuccess, onError, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();

  const createOrder = async () => {
    try {
      console.log('PayPal createOrder called');
      setLoading(true);
      setError(null);

      // Check authentication token
      const token = localStorage.getItem('auth_token');
      console.log('PayPal createOrder - Token exists:', !!token);
      
      if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện thanh toán');
      }

      // Convert VND to USD if needed (approximate rate: 1 USD = 25,000 VND)
      const paymentCurrency = plan.currency === 'VND' ? 'USD' : (plan.currency || 'USD');
      const paymentAmount = plan.currency === 'VND' ? Math.round(Number(plan.price) / 25000) : plan.price;

      console.log('PayPal createOrder - Payment details:', {
        original_price: plan.price,
        original_currency: plan.currency,
        payment_amount: paymentAmount,
        payment_currency: paymentCurrency,
        plan_id: plan.id
      });

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
        }
        
        throw new Error(`Lỗi tạo đơn hàng: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('PayPal createOrder - Success response:', data);
      
      if (!data.order_id) {
        throw new Error('Không nhận được order ID từ server');
      }

      setLoading(false);
      return data.order_id;
    } catch (error) {
      console.error('PayPal createOrder - Error:', error);
      setLoading(false);
      setError(error instanceof Error ? error.message : 'Lỗi không xác định');
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      console.log('PayPal onApprove called with data:', data);
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Bạn cần đăng nhập để hoàn tất thanh toán');
      }

      // Call your backend API to capture the payment
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
      const response = await fetch(`${apiBaseUrl}/paypal/capture-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: data.orderID,
          plan_id: plan.id,
        }),
      });

      console.log('PayPal capture - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PayPal capture - Error response:', errorText);
        throw new Error(`Lỗi xử lý thanh toán: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PayPal capture - Success response:', result);

      setLoading(false);
      onSuccess(result);
    } catch (error) {
      console.error('PayPal onApprove - Error:', error);
      setLoading(false);
      setError(error instanceof Error ? error.message : 'Lỗi xử lý thanh toán');
      onError(error);
    }
  };

  const onErrorHandler = (error: any) => {
    console.error('PayPal onError:', error);
    setError('Lỗi PayPal: ' + (error.message || 'Không xác định'));
    onError(error);
  };

  const onCancelHandler = () => {
    console.log('PayPal payment cancelled');
    setLoading(false);
    onCancel();
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải PayPal...</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="text-red-600 p-4 text-center">
        <p>Không thể tải PayPal. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  if (!isResolved) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang khởi tạo PayPal...</span>
      </div>
    );
  }

  return (
    <div className="paypal-container">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang xử lý...</span>
        </div>
      )}

      <PayPalButtons
        style={{
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "paypal"
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onErrorHandler}
        onCancel={onCancelHandler}
        disabled={loading}
      />
      
      <div className="text-sm text-gray-600 mt-2 text-center">
        <p>Thanh toán an toàn với PayPal</p>
        <p>Số tiền: {plan.currency === 'VND' && plan.price ? `$${Math.round(Number(plan.price) / 25000)}` : `${plan.price || 0} ${plan.currency || 'USD'}`}</p>
      </div>
    </div>
  );
};

const PayPalPayment: React.FC<PayPalPaymentProps> = ({
  plan,
  onSuccess,
  onError,
  onCancel
}) => {
  const componentMounted = useRef(true);

  useEffect(() => {
    console.log('PayPal component mounted, plan:', plan);
    componentMounted.current = true;

    return () => {
      console.log('PayPal component unmounting');
      componentMounted.current = false;
    };
  }, [plan.id]);

  // PayPal configuration
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || process.env.REACT_APP_PAYPAL_CLIENT_ID;
  console.log('PayPal Client ID:', paypalClientId);

  if (!paypalClientId) {
    return (
      <div className="text-red-600 p-4 text-center">
        <p>Lỗi cấu hình PayPal: Không tìm thấy Client ID</p>
        <p className="text-sm">Vui lòng kiểm tra biến môi trường VITE_PAYPAL_CLIENT_ID</p>
      </div>
    );
  }

  const initialOptions = {
    "clientId": paypalClientId,
    "currency": "USD",
    "intent": "capture",
    "components": "buttons",
    "disable-funding": "credit,card"
  };

  console.log('PayPal initialOptions:', initialOptions);
  console.log('Component mounted:', componentMounted.current);
  console.log('Plan details:', plan);
  console.log('Plan price type:', typeof plan.price);
  console.log('Plan price value:', plan.price);
  console.log('Plan currency:', plan.currency);
  console.log('Calculated USD amount:', plan.currency === 'VND' && plan.price ? Math.round(Number(plan.price) / 25000) : 'Not VND');

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Thanh toán với PayPal
          </h3>
          <p className="text-gray-600">
            Gói: {plan.name}
          </p>
          <p className="text-xl font-bold text-blue-600">
            {plan.currency === 'VND' && plan.price
              ? `$${Math.round(Number(plan.price) / 25000)} USD` 
              : `${plan.price || 0} ${plan.currency || 'USD'}`
            }
          </p>
        </div>

        <PayPalScriptProvider 
          options={initialOptions}
          deferLoading={false}
        >
          <PayPalButtonsWrapper
            plan={plan}
            onSuccess={onSuccess}
            onError={onError}
            onCancel={onCancel}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
};

export default PayPalPayment;