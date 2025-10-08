import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
  const { theme } = useTheme();
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
      <div className={`flex items-center justify-center p-8 min-w-[600px] ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
          theme === 'dark' ? 'border-blue-400' : 'border-blue-600'
        }`}></div>
        <span className="ml-2">Đang tạo đơn hàng...</span>
      </div>
    );
  }

  if (error && !bankInfo) {
    return (
      <div className={`p-6 min-w-[600px] border rounded-lg ${
        theme === 'dark' 
          ? 'bg-red-900/20 border-red-800 text-red-200' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className={`font-medium mb-2 ${
          theme === 'dark' ? 'text-red-300' : 'text-red-800'
        }`}>Có lỗi xảy ra</div>
        <div className={`text-sm mb-4 ${
          theme === 'dark' ? 'text-red-400' : 'text-red-600'
        }`}>{error}</div>
        <button
          onClick={createOrder}
          className={`px-4 py-2 rounded transition-colors ${
            theme === 'dark'
              ? 'bg-red-700 text-white hover:bg-red-600'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!bankInfo) {
    return (
      <div className="min-w-[600px]">
        <div className="text-center mb-6">
          <h3 className={`text-lg font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Thanh toán chuyển khoản ngân hàng</h3>
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Thanh toán an toàn qua chuyển khoản ngân hàng</p>
        </div>
        
        <div className={`border rounded-lg p-4 mb-6 ${
          theme === 'dark'
            ? 'bg-blue-900/20 border-blue-800'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center mb-2">
            <svg className={`w-5 h-5 mr-2 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className={`font-medium ${
              theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
            }`}>Thông tin thanh toán</span>
          </div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
          }`}>
            <div>Gói: {plan.name}</div>
            <div>Số tiền: {plan.price.toLocaleString()} {plan.currency}</div>
          </div>
        </div>

        <button
          onClick={createOrder}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Tiến hành chuyển khoản
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 min-w-[700px] max-w-4xl">
      <div className="text-center mb-6">
        <h3 className={`text-xl font-semibold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Thông tin chuyển khoản</h3>
        {paymentStatus === 'checking' && (
          <div className={`flex items-center justify-center ${
            theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
          }`}>
            <div className={`animate-spin rounded-full h-4 w-4 border-b-2 mr-2 ${
              theme === 'dark' ? 'border-orange-400' : 'border-orange-600'
            }`}></div>
            <span>Đang chờ thanh toán...</span>
          </div>
        )}
        {paymentStatus === 'paid' && (
          <div className={`font-medium ${
            theme === 'dark' ? 'text-green-400' : 'text-green-600'
          }`}>✓ Thanh toán thành công!</div>
        )}
      </div>

      {/* Layout 2 cột: Thông tin chuyển khoản + QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cột trái: Thông tin chuyển khoản */}
        <div className={`border rounded-lg p-6 ${
          theme === 'dark'
            ? 'border-gray-700 bg-gray-800/50'
            : 'border-gray-200 bg-white'
        }`}>
          <h4 className={`font-semibold mb-4 text-center text-lg ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Chi tiết chuyển khoản</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>Ngân hàng:</span>
              <span className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{bankInfo.bank_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>Số tài khoản:</span>
              <div className="flex items-center">
                <span className={`font-mono font-semibold ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}>{bankInfo.account_number}</span>
                <button
                  onClick={() => copyToClipboard(bankInfo.account_number)}
                  className={`ml-2 p-1 rounded transition-colors ${
                    theme === 'dark'
                      ? 'text-blue-400 hover:bg-gray-700'
                      : 'text-blue-600 hover:bg-blue-100'
                  }`}
                  title="Sao chép"
                >
                  📋
                </button>
              </div>
            </div> 
            
            <div className="flex justify-between items-center">
              <span className={`font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>Tên tài khoản:</span>
              <span className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{bankInfo.account_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>Số tiền:</span>
              <div className="flex items-center">
                <span className={`font-mono font-bold text-lg ${
                  theme === 'dark' ? 'text-red-400' : 'text-red-600'
                }`}>
                  {bankInfo.amount.toLocaleString()} VND
                </span>
                <button
                  onClick={() => copyToClipboard(bankInfo.amount.toString())}
                  className={`ml-2 p-1 rounded transition-colors ${
                    theme === 'dark'
                      ? 'text-blue-400 hover:bg-gray-700'
                      : 'text-blue-600 hover:bg-blue-100'
                  }`}
                  title="Sao chép"
                >
                  📋
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>Nội dung CK:</span>
              <div className="flex items-center">
                <span className={`font-mono px-2 py-1 rounded text-sm font-semibold ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-yellow-400'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {bankInfo.transfer_content}
                </span>
                <button
                  onClick={() => copyToClipboard(bankInfo.transfer_content)}
                  className={`ml-2 p-1 rounded transition-colors ${
                    theme === 'dark'
                      ? 'text-blue-400 hover:bg-gray-700'
                      : 'text-blue-600 hover:bg-blue-100'
                  }`}
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
          <div className={`border rounded-lg p-6 ${
            theme === 'dark'
              ? 'border-gray-700 bg-gray-800/50'
              : 'border-gray-200 bg-white'
          }`}>
            <h4 className={`font-semibold mb-4 text-center text-lg ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Quét mã QR</h4>
            <div className="text-center">
              <div className={`mb-3 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Quét mã QR để chuyển khoản nhanh
              </div>
              <img 
                src={`https://img.vietqr.io/image/vcb-${bankInfo.account_number}-compact2.png?amount=${bankInfo.amount}&addInfo=${bankInfo.transfer_content}&accountName=${bankInfo.account_name}`} 
                alt="QR Code" 
                className={`mx-auto border rounded max-w-full h-auto ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                }`}
                style={{ maxWidth: '280px' }}
              />
              <div className={`mt-3 text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Mã QR đã bao gồm đầy đủ thông tin chuyển khoản
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`border rounded-lg p-4 mb-4 ${
        theme === 'dark'
          ? 'bg-yellow-900/20 border-yellow-800'
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-start">
          <svg className={`w-5 h-5 mr-2 mt-0.5 ${
            theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
          }`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-yellow-300' : 'text-yellow-800'
          }`}>
            <div className="font-medium mb-1">Lưu ý quan trọng:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Chuyển khoản đúng số tiền: <strong className={`${
                theme === 'dark' ? 'text-yellow-200' : 'text-yellow-900'
              }`}>{bankInfo.amount.toLocaleString()} VND</strong></li>
              <li>Nhập đúng nội dung: <strong className={`${
                theme === 'dark' ? 'text-yellow-200' : 'text-yellow-900'
              }`}>{bankInfo.transfer_content}</strong></li>
              <li>Hệ thống sẽ tự động xác nhận thanh toán trong vòng 1-2 phút</li>
              <li>Đơn hàng sẽ hết hạn sau 10 phút nếu chưa thanh toán</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className={`border rounded-lg p-4 mb-4 ${
          theme === 'dark'
            ? 'bg-red-900/20 border-red-800'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-red-400' : 'text-red-800'
          }`}>{error}</div>
        </div>
      )}
    </div>
  );
};

export default SePayPayment;