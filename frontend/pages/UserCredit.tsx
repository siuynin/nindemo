import React, { useState, useEffect } from 'react'; 
import { useTheme } from '../contexts/ThemeContext';
import { userCreditService, type CreditResponse, type CreditTransaction } from '../services/userCreditService';

interface CreditItem {
  id: number;
  user_id: number;
  pricing_plan_id?: number;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  expires_at?: string;
  credit_type: 'free' | 'purchased' | 'bonus';
  created_at: string;
  updated_at: string;
}

interface CreditSummary {
  total: number;
  used: number;
  remaining: number;
  expired: number;
}

const UserCredit: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditItem[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [summary, setSummary] = useState<CreditSummary>({
    total: 0,
    used: 0,
    remaining: 0,
    expired: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  useEffect(() => {
    fetchCreditData();
  }, []);

  const fetchCreditData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user credits
      const creditResponse = await userCreditService.getUserCredits(false); // Force refresh
      
      if (!creditResponse.success) {
        throw new Error(creditResponse.message || 'Failed to fetch credits');
      }

      if (creditResponse.data) {
        const { credits: creditList, total_remaining } = creditResponse.data;
        setCredits(creditList);

        // Calculate summary
        const totalCredits = creditList.reduce((sum, credit) => sum + credit.total_credits, 0);
        const usedCredits = creditList.reduce((sum, credit) => sum + credit.used_credits, 0);
        const now = new Date();
        const expiredCredits = creditList
          .filter(credit => credit.expires_at && new Date(credit.expires_at) < now)
          .reduce((sum, credit) => sum + credit.remaining_credits, 0);

        setSummary({
          total: totalCredits,
          used: usedCredits,
          remaining: typeof total_remaining === 'number' ? total_remaining : parseFloat(total_remaining),
          expired: expiredCredits
        });
      }

      // Fetch transaction history
      const historyResponse = await userCreditService.getCreditHistory(1, 50);
      if (historyResponse.success && historyResponse.data) {
        setTransactions(historyResponse.data.transactions);
      }

    } catch (err) {
      console.error('Error fetching credit data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching credit data');
    } finally {
      setLoading(false);
    }
  };

  const getCreditTypeLabel = (type: string) => {
    switch (type) {
      case 'free': return 'Free Credits';
      case 'purchased': return 'Purchased Credits';
      case 'bonus': return 'Bonus Credits';
      default: return type;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deduct': return 'Usage';
      case 'add': return 'Added';
      case 'refund': return 'Refund';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Lỗi khi tải dữ liệu
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchCreditData}
                    className="bg-red-100 dark:bg-red-800 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCredits = (amount: number) => {
    return userCreditService.formatCredits(amount);
  };

  const getTotalCredits = () => {
    return summary.total;
  };

  const getUsedCredits = () => {
    return summary.used;
  };

  const getRemainingCredits = () => {
    return summary.remaining;
  };

  const getExpiredCredits = () => {
    return summary.expired;
  };

 

  return (
      <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Quản lý Credit
            </h1>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Mua thêm Credit
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`rounded-lg shadow-md p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  💰
                </div>
                <div className="ml-4">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    Credit còn lại
                  </p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {formatCredits(getRemainingCredits())}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow-md p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  📊
                </div>
                <div className="ml-4">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    Đã sử dụng
                  </p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {formatCredits(getUsedCredits())}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow-md p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  ⏰
                </div>
                <div className="ml-4">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    Đã hết hạn
                  </p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {formatCredits(getExpiredCredits())}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow-md p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  📦
                </div>
                <div className="ml-4">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    Tổng gói
                  </p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {credits.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  Tổng quan Credit
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  Lịch sử giao dịch
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className={`rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Chi tiết Credit
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Loại Credit
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Tổng số
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Đã sử dụng
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Còn lại
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Hạn sử dụng
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    {credits.map((credit) => (
                      <tr key={credit.id}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {getCreditTypeLabel(credit.credit_type)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {formatCredits(credit.total_credits)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {formatCredits(credit.used_credits)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {formatCredits(credit.remaining_credits)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {credit.expires_at ? formatDate(credit.expires_at) : 'Không giới hạn'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            credit.remaining_credits > 0 && (!credit.expires_at || new Date(credit.expires_at) > new Date())
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                              : credit.expires_at && new Date(credit.expires_at) <= new Date()
                              ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {credit.remaining_credits > 0 && (!credit.expires_at || new Date(credit.expires_at) > new Date())
                              ? 'Hoạt động'
                              : credit.expires_at && new Date(credit.expires_at) <= new Date()
                              ? 'Hết hạn'
                              : 'Đã sử dụng hết'
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className={`rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Lịch sử giao dịch
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Ngày
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Loại
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Credit
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Số lượng
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Mô tả
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Mã giao dịch
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.transaction_type === 'add' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' :
                            transaction.transaction_type === 'deduct' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                          }`}>
                            {getTransactionTypeLabel(transaction.transaction_type)}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {transaction.service_type || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          transaction.transaction_type === 'add' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.transaction_type === 'add' ? '+' : '-'}{formatCredits(transaction.amount)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {transaction.description || 'Không có mô tả'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          #{transaction.id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  export default UserCredit;