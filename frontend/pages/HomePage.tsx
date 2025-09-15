import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PenIcon, ImageIcon, PencilIcon } from '../components/icons';
import InstallPrompt from '../components/InstallPrompt';

const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const services = [
    {
      title: t.sidebar.imageCanvas.title,
      description: t.sidebar.imageCanvas.description,
      icon: <PencilIcon className="w-12 h-12" />,
      link: '/image-canvas',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      title: t.sidebar.writeAssistant.title,
      description: t.sidebar.writeAssistant.description,
      icon: <PenIcon className="w-12 h-12" />,
      link: '/write-assistant',
      gradient: 'from-green-500 to-teal-600'
    },
    {
      title: t.sidebar.imageCreator.title,
      description: t.sidebar.imageCreator.description,
      icon: <ImageIcon className="w-12 h-12" />,
      link: '/image-creator',
      gradient: 'from-pink-500 to-rose-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-white font-bold text-2xl">AI</span>
            </div>
          </div>
          <h1 className={`text-5xl md:text-6xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {t.homepage?.title || 'AI Studio'}
          </h1>
          <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t.homepage?.subtitle || 'Khám phá sức mạnh của AI với bộ công cụ toàn diện cho sáng tạo và viết lách'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/image-canvas"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {t.homepage?.getStarted || 'Bắt đầu ngay'}
            </Link>
            <Link
              to="/write-assistant"
              className={`px-8 py-4 border-2 font-semibold rounded-xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.homepage?.learnMore || 'Tìm hiểu thêm'}
            </Link>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <Link
              key={index}
              to={service.link}
              className={`group p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:bg-gray-800'
                  : 'bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white'
              }`}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <div className="text-white">
                  {service.icon}
                </div>
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {service.title}
              </h3>
              <p className={`text-lg leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {service.description}
              </p>
              <div className={`mt-6 flex items-center text-sm font-medium ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {t.homepage?.explore || 'Khám phá'} →
              </div>
            </Link>
          ))}
        </div>

        {/* Features Section */}
        <div className={`text-center p-12 rounded-2xl ${
          theme === 'dark'
            ? 'bg-gray-800/30 border border-gray-700'
            : 'bg-white/50 border border-gray-200'
        }`}>
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {t.homepage?.whyChoose || 'Tại sao chọn AI Studio?'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t.homepage?.fastPowerful || 'Nhanh & Mạnh mẽ'}
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t.homepage?.fastDesc || 'Công nghệ AI tiên tiến cho kết quả nhanh chóng và chính xác'}
              </p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t.homepage?.easyToUse || 'Dễ sử dụng'}
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t.homepage?.easyDesc || 'Giao diện thân thiện, không cần kinh nghiệm kỹ thuật'}
              </p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t.homepage?.creative || 'Sáng tạo'}
              </h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t.homepage?.creativeDesc || 'Giải phóng tiềm năng sáng tạo với công cụ AI đa dạng'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  );
};

export default HomePage;