import React, { useState } from 'react';
import { useVersionCheck } from '../../hooks/useVersionCheck';

/**
 * Version Info Component - Shows current version and update status
 * Can be integrated into settings or footer
 */
export const VersionInfo: React.FC = () => {
  const { currentVersion, isChecking, checkForUpdates } = useVersionCheck();
  const [showDetails, setShowDetails] = useState(false);

  const handleCheckUpdate = async () => {
    await checkForUpdates();
  };

  const formatVersion = (version: string) => {
    if (version.length <= 8) return version;
    return `${version.substring(0, 8)}...`;
  };

  const buildDate = document.querySelector('meta[name="build-date"]')?.getAttribute('content');

  return (
    <div className="version-info">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Phiên bản:</span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="font-mono text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
          title="Nhấn để xem chi tiết"
        >
          {formatVersion(currentVersion || 'dev')}
        </button>
        
        <button
          onClick={handleCheckUpdate}
          disabled={isChecking}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
          title="Kiểm tra cập nhật"
        >
          {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra cập nhật'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <div><strong>Version:</strong> {currentVersion || 'development'}</div>
          {buildDate && <div><strong>Ngày build:</strong> {buildDate}</div>}
          <div className="mt-2 text-gray-500">
            Ứng dụng sẽ tự động kiểm tra và thông báo khi có bản cập nhật mới.
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionInfo;