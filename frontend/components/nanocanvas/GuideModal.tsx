import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from '../icons';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TimeSection {
  title: string;
  time: number; // thời gian tính bằng giây
}

const timeSections: TimeSection[] = [
  { title: "Giới thiệu tổng quan", time: 0 },
  { title: "Cách sử dụng công cụ vẽ", time: 30 },
  { title: "Thêm văn bản và hình ảnh", time: 90 },
  { title: "Sử dụng AI để tạo ảnh", time: 150 },
  { title: "Xuất và lưu dự án", time: 210 },
  { title: "Mẹo và thủ thuật", time: 270 }
];

const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // YouTube video ID từ URL
  const videoId = "QqlPSQ9X4d8";

  const jumpToTime = (time: number) => {
    if (iframeRef.current) {
      // Gửi message đến YouTube iframe để jump tới thời gian cụ thể
      iframeRef.current.src = `https://www.youtube.com/embed/${videoId}?start=${time}&autoplay=1&enablejsapi=1`;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Hướng dẫn sử dụng
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
          {/* Video Player */}
          <div className="flex-1 p-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                title="Hướng dẫn sử dụng"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            {/* Nút đóng bổ sung ở dưới video */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <XIcon className="w-4 h-4" />
                Đóng hướng dẫn
              </button>
            </div>
          </div>

          {/* Time Sections */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Mục lục
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {timeSections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => jumpToTime(section.time)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentTime === section.time
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{section.title}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(section.time)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;