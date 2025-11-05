import { useEffect, useState } from 'react';
import { versionService } from '../src/services/versionService';

/**
 * Hook to check for application updates
 * Returns current version info and functions to check for updates
 */
export const useVersionCheck = () => {
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Get current version from meta tags
    const versionMeta = document.querySelector('meta[name="build-version"]') as HTMLMetaElement;
    const timestampMeta = document.querySelector('meta[name="build-timestamp"]') as HTMLMetaElement;
    
    if (versionMeta?.content) {
      setCurrentVersion(versionMeta.content);
    } else if (timestampMeta?.content) {
      setCurrentVersion(timestampMeta.content);
    }
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      await versionService.checkNow();
      // The service will handle showing the update notification
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const reloadApp = () => {
    versionService.reloadApplication();
  };

  return {
    currentVersion,
    isChecking,
    hasUpdate,
    checkForUpdates,
    reloadApp
  };
};

export default useVersionCheck;