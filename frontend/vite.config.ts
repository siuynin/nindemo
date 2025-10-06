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
          registerType: 'autoUpdate'
        })
      ],
      // Cấu hình build cần đặt ở cấp độ root, không nằm trong VitePWA
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'ui-vendor': ['@headlessui/react', '@heroicons/react'],
              'editor-vendor': ['@cesdk/cesdk-js', '@cesdk/engine']
            }
          }
        },
        chunkSizeWarningLimit: 1000 // Cảnh báo khi chunk > 1MB
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.VITE_RUNWARE_API_KEY': JSON.stringify(env.VITE_RUNWARE_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      assetsInclude: ['**/*.wasm'],
      optimizeDeps: {
        exclude: ['@cesdk/cesdk-js', '@cesdk/engine']
      },
      server: {
        port: 5175,
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
