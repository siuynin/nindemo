/**
 * Version Service - Auto reload when new build is deployed
 * Checks for new deployments and prompts user to reload
 */

class VersionService {
  private currentVersion: string = '';
  private checkInterval: number | null = null;
  private readonly CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
  private readonly VERSION_FILE = '/version.json';

  constructor() {
    this.currentVersion = this.getCurrentVersion();
  }

  /**
   * Get current version from meta tag or build timestamp
   */
  private getCurrentVersion(): string {
    // Try to get version from meta tag first
    const versionMeta = document.querySelector('meta[name="build-version"]') as HTMLMetaElement;
    if (versionMeta?.content) {
      return versionMeta.content;
    }

    // Fallback to build timestamp
    const buildMeta = document.querySelector('meta[name="build-timestamp"]') as HTMLMetaElement;
    if (buildMeta?.content) {
      return buildMeta.content;
    }

    // Fallback to current timestamp (for development)
    return new Date().toISOString();
  }

  /**
   * Check for new version by fetching version.json
   */
  private async checkForNewVersion(): Promise<boolean> {
    try {
      // Add cache-busting parameter to avoid browser cache
      const url = `${this.VERSION_FILE}?t=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        console.warn('Version check failed:', response.status);
        return false;
      }

      const data = await response.json();
      const serverVersion = data.version || data.buildTimestamp || data.timestamp;

      if (serverVersion && serverVersion !== this.currentVersion) {
        console.log('New version detected:', {
          current: this.currentVersion,
          server: serverVersion
        });
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Version check error:', error);
      return false;
    }
  }

  /**
   * Show update notification to user
   */
  private showUpdateNotification(): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'version-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4f46e5;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 320px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">Có bản cập nhật mới!</div>
            <div style="opacity: 0.9; font-size: 13px;">Ứng dụng đã có phiên bản mới. Tải lại để cập nhật.</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="reload-now" style="
              background: white;
              color: #4f46e5;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: opacity 0.2s;
            ">Tải lại</button>
            <button id="reload-later" style="
              background: transparent;
              color: white;
              border: 1px solid rgba(255,255,255,0.3);
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 13px;
              cursor: pointer;
              transition: all 0.2s;
            ">Để sau</button>
          </div>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // Add event listeners
    document.getElementById('reload-now')?.addEventListener('click', () => {
      this.reloadApplication();
    });

    document.getElementById('reload-later')?.addEventListener('click', () => {
      notification.remove();
      // Continue checking for updates
      this.start();
    });
  }

  /**
   * Reload the application
   */
  private reloadApplication(): void {
    try {
      // Try to reload without using cache
      if ('caches' in window) {
        // Clear all caches
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }

      // Clear service worker cache if exists
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        });
      }

      // Force reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Reload error:', error);
      // Fallback to simple reload
      window.location.reload();
    }
  }

  /**
   * Perform version check
   */
  private async performCheck(): Promise<void> {
    const hasNewVersion = await this.checkForNewVersion();
    
    if (hasNewVersion) {
      this.stop(); // Stop checking while showing notification
      this.showUpdateNotification();
    }
  }

  /**
   * Start version checking
   */
  public start(): void {
    if (this.checkInterval) {
      return; // Already running
    }

    console.log('Version checking started');
    
    // Check immediately
    this.performCheck();

    // Then check periodically
    this.checkInterval = window.setInterval(() => {
      this.performCheck();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop version checking
   */
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Version checking stopped');
    }
  }

  /**
   * Manually check for updates
   */
  public async checkNow(): Promise<void> {
    console.log('Manual version check requested');
    await this.performCheck();
  }
}

// Create singleton instance
export const versionService = new VersionService();

// Auto-start in production
if (import.meta.env.PROD) {
  // Start after a short delay to allow page to load
  setTimeout(() => {
    versionService.start();
  }, 5000);
}

export default versionService;