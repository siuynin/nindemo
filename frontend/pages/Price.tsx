import React, { useState, useEffect } from 'react';
import { pricingService, PricingPlan } from '../services/pricingService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import PaymentMethodModal from '../components/PaymentMethodModal';

const Price: React.FC = () => {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const plans = await pricingService.getPublicPricingPlans();
      setPricingPlans(plans);
    } catch (err) {
      setError('Không thể tải danh sách gói giá. Vui lòng thử lại sau.');
      console.error('Error fetching pricing plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
    }).format(price);
  };

  const formatDuration = (days: number) => {
    if (days === 30) return '1 tháng';
    if (days === 365) return '1 năm';
    if (days === 7) return '1 tuần';
    return `${days} ngày`;
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    if (!user) {
      alert('Vui lòng đăng nhập để chọn gói.');
      return;
    }
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentMethodSelect = (method: 'paypal' | 'bank_transfer') => {
    if (!selectedPlan) return;
    
    console.log('Selected payment method:', method, 'for plan:', selectedPlan);
    
    if (method === 'paypal') {
      // TODO: Integrate PayPal payment
      alert(`Đang chuyển hướng đến PayPal để thanh toán gói ${selectedPlan.name}...`);
      // Here you would integrate with PayPal SDK
    } else if (method === 'bank_transfer') {
      // TODO: Show bank transfer instructions
      alert(`Chức năng chuyển khoản ngân hàng sẽ được triển khai sau.`);
    }
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải danh sách gói giá...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchPricingPlans}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bảng Giá Dịch Vụ
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Chọn gói dịch vụ phù hợp với nhu cầu của bạn. Tất cả gói đều bao gồm hỗ trợ 24/7.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.is_premium
                  ? 'border-gradient-to-r from-purple-500 to-pink-500 ring-2 ring-purple-500 ring-opacity-50'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-500'
              }`}
            >
              {plan.is_premium && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Phổ biến nhất
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>

                {/* Plan Description */}
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      / {formatDuration(plan.duration_days)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      {plan.max_voice_clone ? 'Hỗ trợ Voice Clone' : 'Không hỗ trợ Voice Clone'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      {plan.is_premium ? 'Tài khoản Premium' : 'Tài khoản Cơ bản'}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      Hỗ trợ 24/7
                    </span>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      Cập nhật miễn phí
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.is_premium
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {user ? 'Chọn gói này' : 'Đăng nhập để chọn'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {pricingPlans.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Chưa có gói giá nào
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Hiện tại chưa có gói giá nào được thiết lập. Vui lòng quay lại sau.
            </p>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Câu hỏi thường gặp
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tôi có thể thay đổi gói sau khi đăng ký không?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Có, bạn có thể nâng cấp hoặc hạ cấp gói bất cứ lúc nào. Thay đổi sẽ có hiệu lực ngay lập tức.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Có hỗ trợ hoàn tiền không?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Chúng tôi cung cấp chính sách hoàn tiền trong vòng 30 ngày nếu bạn không hài lòng với dịch vụ.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        onPaymentMethodSelect={handlePaymentMethodSelect}
        selectedPlan={selectedPlan}
      />
    </div>
  );
};

export default Price;