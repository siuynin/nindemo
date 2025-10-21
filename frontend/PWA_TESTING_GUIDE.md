# PWA Testing Guide for NDhubs AI

## Overview
This guide explains how to test the Progressive Web App (PWA) functionality for NDhubs AI on different environments.

## Current PWA Status

### ✅ Working Features (Local Development)
- Service Worker registration and caching
- Web App Manifest loading
- Install prompt detection
- HTTPS/localhost support
- Mobile platform detection

### ⚠️ Known Limitations
- `beforeinstallprompt` event only fires under specific conditions
- iOS requires manual installation steps
- HTTPS required for production deployment

## Testing Steps

### 1. Local Development Testing
```bash
# Start frontend development server
cd frontend
npm run dev
```

Access: http://localhost:5176

**Expected Results:**
- Service Worker should register successfully
- Manifest should load without errors
- Install prompt should be available (Chrome/Edge)

### 2. Production Deployment Requirements

#### HTTPS Configuration
PWA requires HTTPS for production:
```nginx
# Example Nginx configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5176;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Domain Testing Checklist
- [ ] HTTPS enabled
- [ ] Service Worker accessible at `/sw.js`
- [ ] Manifest accessible at `/manifest.json`
- [ ] No mixed content warnings
- [ ] Valid SSL certificate

### 3. Mobile Device Testing

#### Android (Chrome)
1. Open website in Chrome
2. Look for "Add to Home Screen" banner
3. If no banner: Menu → "Add to Home Screen"
4. App should install and open in standalone mode

#### iOS (Safari)
1. Open website in Safari
2. Tap Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

### 4. Debug Information

Access debug page: http://localhost:5176/simple-pwa-test.html

This page will show:
- Service Worker status
- HTTPS/Localhost validation
- Manifest loading status
- Platform detection
- Install prompt availability

### 5. Common Issues and Solutions

#### Issue: Service Worker not registering
**Solution:** Check browser console for errors, ensure HTTPS or localhost

#### Issue: Install prompt not showing
**Solution:** 
- Clear browser data
- Check if app is already installed
- Ensure user interaction before prompt

#### Issue: iOS installation fails
**Solution:** 
- Must use Safari browser
- Follow manual installation steps
- Check manifest.json validity

### 6. Production Deployment

#### Build for production:
```bash
cd frontend
npm run build
```

#### Serve with HTTPS:
```bash
# Using a reverse proxy (recommended)
# Configure Nginx/Apache with SSL

# Or use a service like Vercel, Netlify, etc.
```

### 7. Verification Commands

Test service worker:
```bash
curl -I https://your-domain.com/sw.js
```

Test manifest:
```bash
curl -I https://your-domain.com/manifest.json
```

## Component Usage

### SimpleInstallPrompt
Basic install prompt with platform detection:
```tsx
import SimpleInstallPrompt from '../components/SimpleInstallPrompt';

// In your component:
<SimpleInstallPrompt />
```

### PWATestWidget
Debug widget showing PWA status:
```tsx
import PWATestWidget from '../components/PWATestWidget';

// In your component:
<PWATestWidget />
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Web App Manifest | ✅ | ❌ | ✅ | ✅ |
| beforeinstallprompt | ✅ | ❌ | ❌ | ✅ |
| Standalone Mode | ✅ | ❌ | ✅ | ✅ |

## Next Steps

1. **Deploy to production with HTTPS**
2. **Test on actual mobile devices**
3. **Monitor installation rates**
4. **Optimize app icons and splash screens**
5. **Implement push notifications (optional)**

## Support

For issues with PWA functionality:
1. Check browser console for errors
2. Verify HTTPS configuration
3. Test on multiple devices/browsers
4. Review this guide for common solutions