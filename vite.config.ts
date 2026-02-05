import path from 'path';
import { resolve } from 'path'; // 新增 resolve 引入
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    const paypalClientId = env.VITE_PAYPAL_CLIENT_ID || '';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        visualizer({
          open: true,
          filename: 'stats.html',
          gzipSize: true,
          brotliSize: true,
        })
      ],
      define: {
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.VITE_PAYPAL_CLIENT_ID': JSON.stringify(paypalClientId),
        'process.env.API_KEY': JSON.stringify(apiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          // 【核心修改】：配置多页面入口
          input: {
            main: resolve(__dirname, 'index.html'),
            intro: resolve(__dirname, 'intro.html'),
          },
          output: {
            manualChunks: {
              'vendor-ai': ['@google/genai'],
              'vendor-paypal': ['@paypal/react-paypal-js'],
              'vendor-react': ['react', 'react-dom', 'i18next', 'react-i18next']
            }
          }
        },
        chunkSizeWarningLimit: 1000,
      }
    };
});