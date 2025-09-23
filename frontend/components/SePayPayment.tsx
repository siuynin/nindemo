import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

interface Plan {
  id: number;
  name: string;
  price: number;
  currency: string;
}

interface BankInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
  amount: number;
  transfer_content: string;
  qr_code: string;
}

interface SePayPaymentProps {
  plan: Plan;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const SePayPayment: React.FC<SePayPaymentProps> = ({ plan, onSuccess, onError }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'paid' | 'failed'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [checkingInterval, setCheckingInterval] = useState<NodeJS.Timeout | null>(null);

  const createOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication
      const token = authService.getToken();
      console.log('=== SePay Debug Info ===');
      console.log('Token exists:', !!token);
      console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('User object:', user);
      console.log('User authenticated:', !!user);
      console.log('AuthService authenticated:', authService.isAuthenticated());

      if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện thanh toán');
      }

      if (!user) {
        throw new Error('Thông tin người dùng không hợp lệ');
      }

      // Convert VND to VND (no conversion needed for bank transfer)
      const paymentCurrency = plan.currency || 'VND';
      const paymentAmount = plan.price;

      // Call backend API to create SePay order
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
      console.log('API URL:', `${apiBaseUrl}/sepay/create-order`);
      
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };
      
      console.log('Request headers:', requestHeaders);

      const requestBody = {
        amount: paymentAmount,
        currency: paymentCurrency,
        plan_id: plan.id,
        user_id: user.id
      };
      console.log('Request body:', requestBody);

      const response = await fetch(`${apiBaseUrl}/sepay/create-order`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setBankInfo(data.bank_info);
        setOrderId(data.order_id);
        setPaymentStatus('checking');
        startPaymentCheck(data.order_id);
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
    } catch (err: any) {
      console.error('SePay create order error:', err);
      setError(err.message);
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startPaymentCheck = (orderIdToCheck: string) => {
    const interval = setInterval(async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
        const token = authService.getToken();
        const response = await fetch(`${apiBaseUrl}/sepay/check-payment/${orderIdToCheck}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
        const data = await response.json();
        if (data.success && data.status === 'paid') {
          setPaymentStatus('paid');
          clearInterval(interval);
          onSuccess();
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    }, 5000); // Check every 5 seconds

    setCheckingInterval(interval);

    // Stop checking after 10 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (paymentStatus === 'checking') {
        setPaymentStatus('failed');
        setError('Timeout: Payment not detected within 10 minutes');
      }
    }, 600000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    return () => {
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
    };
  }, [checkingInterval]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tạo đơn hàng...</span>
      </div>
    );
  }

  if (error && !bankInfo) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800 font-medium mb-2">Có lỗi xảy ra</div>
        <div className="text-red-600 text-sm mb-4">{error}</div>
        <button
          onClick={createOrder}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!bankInfo) {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Thanh toán chuyển khoản ngân hàng</h3>
          <p className="text-gray-600">Thanh toán an toàn qua chuyển khoản ngân hàng</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-blue-800">Thông tin thanh toán</span>
          </div>
          <div className="text-blue-700 text-sm">
            <div>Gói: {plan.name}</div>
            <div>Số tiền: {plan.price.toLocaleString()} {plan.currency}</div>
          </div>
        </div>

        <button
          onClick={createOrder}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Tiến hành chuyển khoản
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Thông tin chuyển khoản</h3>
        {paymentStatus === 'checking' && (
          <div className="flex items-center justify-center text-orange-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
            <span>Đang chờ thanh toán...</span>
          </div>
        )}
        {paymentStatus === 'paid' && (
          <div className="text-green-600 font-medium">✓ Thanh toán thành công!</div>
        )}
      </div>

      {/* Layout 2 cột: Thông tin chuyển khoản + QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cột trái: Thông tin chuyển khoản */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-4 text-center">Chi tiết chuyển khoản</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Ngân hàng:</span>
              <span>{bankInfo.bank_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Số tài khoản:</span>
              <div className="flex items-center">
                <span className="font-mono">{bankInfo.account_number}</span>
                <button
                  onClick={() => copyToClipboard(bankInfo.account_number)}
                  className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="Sao chép"
                >
                  📋
                </button>
              </div>
            </div> 
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Tên tài khoản:</span>
              <span>{bankInfo.account_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Số tiền:</span>
              <div className="flex items-center">
                <span className="font-mono text-red-600 font-bold">
                  {bankInfo.amount.toLocaleString()} VND
                </span>
                <button
                  onClick={() => copyToClipboard(bankInfo.amount.toString())}
                  className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="Sao chép"
                >
                  📋
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Nội dung CK:</span>
              <div className="flex items-center">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {bankInfo.transfer_content}
                </span>
                <button
                  onClick={() => copyToClipboard(bankInfo.transfer_content)}
                  className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="Sao chép"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: QR Code */}
        {bankInfo.qr_code && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-4 text-center">Quét mã QR</h4>
            <div className="text-center">
              <div className="mb-3 text-sm text-gray-600">
                Quét mã QR để chuyển khoản nhanh
              </div>
              <img 
                src={`https://img.vietqr.io/image/vcb-${bankInfo.account_number}-compact2.png?amount=${bankInfo.amount}&addInfo=${bankInfo.transfer_content}&accountName=${bankInfo.account_name}`} 
                alt="QR Code" 
                className="mx-auto border border-gray-300 rounded max-w-full h-auto"
                style={{ maxWidth: '250px' }}
              />
              <div className="mt-3 text-xs text-gray-500">
                Mã QR đã bao gồm đầy đủ thông tin chuyển khoản
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-yellow-800 text-sm">
            <div className="font-medium mb-1">Lưu ý quan trọng:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Chuyển khoản đúng số tiền: <strong>{bankInfo.amount.toLocaleString()} VND</strong></li>
              <li>Nhập đúng nội dung: <strong>{bankInfo.transfer_content}</strong></li>
              <li>Hệ thống sẽ tự động xác nhận thanh toán trong vòng 1-2 phút</li>
              <li>Đơn hàng sẽ hết hạn sau 10 phút nếu chưa thanh toán</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}
    </div>
  );
};

export default SePayPayment;