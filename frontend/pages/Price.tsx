import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { pricingService, type PricingPlan } from '../services/pricingService';
import { userCreditService } from '../services/userCreditService';
import PaymentMethodModal from '../components/PaymentMethodModal';

const Price: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activatingFreePlan, setActivatingFreePlan] = useState<number | null>(null);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      setLoading(true);
      const fetchedPlans = await pricingService.getPublicPricingPlans();
      setPlans(fetchedPlans);
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

  const formatDuration = (billingCycle: string, days?: number) => {
    // Sử dụng billing_cycle nếu có, ngược lại fallback về duration_days
    if (billingCycle) {
      switch (billingCycle) {
        case 'monthly': return 'tháng';
        case 'yearly': return 'năm';
        case 'lifetime': return 'trọn đời';
        case 'weekly': return 'tuần';
        default: return billingCycle;
      }
    }
    
    // Fallback cho duration_days (giữ lại để tương thích ngược)
    if (days === 30) return '1 tháng';
    if (days === 365) return '1 năm';
    if (days === 7) return '1 tuần';
    return `${days} ngày`;
  };

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (!user) {
      alert('Vui lòng đăng nhập để chọn gói.');
      return;
    }
    
    // Nếu là gói free (giá = 0), tự động kích hoạt
    // Xử lý cả trường hợp price là string hoặc number
    const price = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
    if (price === 0) {
      await handleActivateFreePlan(plan);
    } else {
      // Nếu là gói trả phí, mở modal thanh toán
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    }
  };

  const handleActivateFreePlan = async (plan: PricingPlan) => {
    try {
      setActivatingFreePlan(plan.id);
      
      // Gọi API để kích hoạt gói free
      const response = await userCreditService.activateFreePlan(plan.id);
      
      if (response.success) {
        alert('Gói miễn phí đã được kích hoạt thành công!');
        // Refresh user data để cập nhật plan hiện tại
        window.location.reload();
      } else {
        alert(response.message || 'Có lỗi xảy ra khi kích hoạt gói miễn phí');
      }
    } catch (error) {
      console.error('Error activating free plan:', error);
      alert('Có lỗi xảy ra khi kích hoạt gói miễn phí');
    } finally {
      setActivatingFreePlan(null);
    }
  };

  const isCurrentPlan = (planId: number) => {
    return user?.pricing_plan?.id === planId;
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
    
    setShowPaymentModal(false);
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
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.is_popular ? 'border-blue-500 scale-105' : 'border-gray-200 dark:border-gray-700'
              }`}
            > 
              {plan.features === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    ✨ Có tính năng đặc biệt
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
                      / {formatDuration(plan.billing_cycle, plan.duration_days)}
                    </span>
                  </div>
                  {/* Credit Info */}
                  <div className="mt-3 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg py-2 px-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {plan.credits?.toLocaleString() || 0} credits
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
                      ({plan.credits ? (plan.price / plan.credits).toFixed(2) : '0'} {plan.currency || 'VND'}/credit)
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
                      {plan.max_voice_clone > 0 ? `Hỗ trợ Voice Clone (${plan.max_voice_clone} giọng)` : 'Không hỗ trợ Voice Clone'}
                    </span>
                  </div>   

                  {/* Custom Feature List */}
                  {plan.feature_list && plan.feature_list.length > 0 && (
                    plan.feature_list.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))
                  )}
                </div> 
                
                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrentPlan(plan.id) || activatingFreePlan === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    isCurrentPlan(plan.id)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : activatingFreePlan === plan.id
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : plan.is_popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCurrentPlan(plan.id)
                    ? 'Current Plan'
                    : activatingFreePlan === plan.id
                    ? 'Đang kích hoạt...'
                    : (typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price) === 0
                    ? 'Kích hoạt miễn phí'
                    : 'Chọn gói này'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {plans.length === 0 && !loading && (
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
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentMethodSelect={handlePaymentMethodSelect}
        selectedPlan={selectedPlan}
      />
    </div>
  );
};

export default Price;