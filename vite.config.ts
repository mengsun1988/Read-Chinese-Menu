import path from 'path';
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
        // 自动开启可视化分析，打包完成后在浏览器打开 stats.html
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
          output: {
            // [核心优化]：将体积巨大的第三方库拆分成独立文件
            manualChunks: {
              'vendor-ai': ['@google/genai'],
              'vendor-paypal': ['@paypal/react-paypal-js'],
              'vendor-react': ['react', 'react-dom', 'i18next', 'react-i18next']
            }
          }
        },
        // 提高超大块警告阈值到 1000kb，因为我们已经手动拆分了
        chunkSizeWarningLimit: 1000,
      }
    };
});