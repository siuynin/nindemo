import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          devOptions: {
            enabled: true, // Enable service worker in development
            type: 'module',
            navigateFallback: 'index.html'
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            maximumFileSizeToCacheInBytes: 10000000,
            skipWaiting: true,
            clientsClaim: true,
            cleanupOutdatedCaches: true,
            navigateFallback: 'index.html',
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  }
                }
              }
            ]
          },
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'NDhubs AI - Creative Assistant',
            short_name: 'NDhubs AI',
            description: 'AI-powered creative assistant for text generation, audio synthesis, image creation, and video production',
            theme_color: '#3b82f6',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            categories: ['productivity', 'utilities', 'business'],
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      // Cấu hình build cần đặt ở cấp độ root, không nằm trong VitePWA
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'ui-vendor': ['@headlessui/react', '@heroicons/react'],
              'router-vendor': ['react-router-dom'],
              'utils-vendor': ['lodash', 'chroma-js', 'classnames']
            }
          }
        },
        chunkSizeWarningLimit: 1000, // Cảnh báo khi chunk > 1MB
        minify: 'terser', // Sử dụng terser thay vì esbuild để tránh lỗi minification
        terserOptions: {
          compress: {
            drop_console: false, // Giữ console.log để debug
            drop_debugger: false
          },
          mangle: {
            keep_fnames: true, // Giữ tên function để tránh lỗi 'o is not a function'
            reserved: ['o', 'e', 't', 'n', 'r', 'i', 'a', 's'] // Bảo vệ các tên biến ngắn
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.VITE_RUNWARE_API_KEY': JSON.stringify(env.VITE_RUNWARE_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'react': path.resolve(__dirname, './node_modules/react'),
          'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        }
      },
      assetsInclude: ['**/*.wasm'],
      optimizeDeps: {
        include: ['react', 'react-dom']
      },
      server: {
        port: 5175,
        host: '0.0.0.0',
        hmr: {
          port: 5175,
          host: '0.0.0.0'
        },
        proxy: {
          '/api': {
            target: env.VITE_API_BASE_URL?.replace('/api', '') || 'http://127.0.0.1:8001',
            changeOrigin: true,
            secure: false
          }
        }
      }
    };
});
