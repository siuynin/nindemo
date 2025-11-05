# Auto-Reload Feature Guide

## Overview

The auto-reload feature automatically detects when a new version of the application is deployed to Vercel and prompts users to refresh their browser to get the latest updates.

## How It Works

1. **Version Tracking**: During build, a `version.json` file is generated with build information (timestamp, hash, date)
2. **Meta Tags**: Build information is injected into `index.html` as meta tags
3. **Polling Service**: A service runs in the background checking for version updates every 30 seconds
4. **User Notification**: When a new version is detected, users see a notification with options to reload immediately or later

## Components

### 1. Version Service (`src/services/versionService.ts`)
- Polls `version.json` every 30 seconds
- Compares current version with server version
- Shows update notification when versions differ
- Provides functions to manually check and reload

### 2. Version Info Component (`src/components/VersionInfo.tsx`)
- Displays current build information
- Provides manual update check button
- Shows update status and notifications

### 3. Version Hook (`hooks/useVersionCheck.ts`)
- React hook for easy integration
- Provides version info and update functions
- Can be used in any component

### 4. Build Configuration
- `vite.config.ts`: Plugin to generate version.json and inject meta tags
- `index.html`: Meta tags for version tracking
- `vercel.json`: Caching headers to ensure version.json is never cached

## Usage

### For Users
- The app will automatically check for updates every 30 seconds
- When an update is available, a notification will appear
- Click "Cập nhật ngay" to reload immediately
- Click "Để sau" to dismiss and reload manually later

### For Developers
- The feature only runs in production mode (`import.meta.env.PROD`)
- Version checking starts automatically when the app loads
- Manual version check can be triggered via the VersionInfo component

## Configuration

### Update Check Interval
Modify the interval in `src/services/versionService.ts`:
```typescript
const CHECK_INTERVAL = 30000; // 30 seconds
```

### Notification Styling
Update the notification styles in `src/services/versionService.ts`:
```typescript
// Custom CSS for the notification
const notificationHTML = `
  <div style="your-custom-styles">
    <!-- notification content -->
  </div>
`;
```

## Deployment

The feature works automatically when deployed to Vercel:
1. Build process generates version.json
2. Meta tags are injected with build info
3. Version service starts polling
4. Users get notified of updates

## Testing

To test the auto-reload feature:
1. Deploy the app to Vercel
2. Open the app in a browser
3. Make changes and deploy a new version
4. Wait 30-60 seconds for the update notification
5. Click "Cập nhật ngay" to reload

## Troubleshooting

### No Update Notification
- Check browser console for version service logs
- Ensure version.json is accessible at `/version.json`
- Verify meta tags are present in index.html

### Version.json Not Found
- Check if build completed successfully
- Verify vercel.json allows access to version.json
- Check vite.config.ts plugin configuration

### Notification Not Appearing
- Ensure you're in production mode
- Check if version service started successfully
- Verify notification styles are not being blocked