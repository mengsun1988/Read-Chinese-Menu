import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 加载 .env.local 和 .env 文件中的环境变量
    const env = loadEnv(mode, process.cwd(), '');
    
    // Vite 前缀规则：只有 VITE_ 开头的变量才会被注入到客户端
    const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    const paypalClientId = env.VITE_PAYPAL_CLIENT_ID || '';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // 为了兼容性，将环境变量注入到 process.env
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.VITE_PAYPAL_CLIENT_ID': JSON.stringify(paypalClientId),
        'process.env.API_KEY': JSON.stringify(apiKey), // 备选
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
