import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// 【优化】删除了 import enPayload，让主包减重

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // 默认语言
    fallbackLng: 'en',
    
    // 【关键修改】移除 resources 静态资源
    // 这样所有语言（包括英文）都会通过后端加载，从而将 JSON 彻底从 JS 主包中分离
    
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    
    backend: {
      // 路径指向 public/locales/{{lng}}.json
      loadPath: '/locales/{{lng}}.json',
      // 使用版本号防止缓存，上线后可根据需要更新版本
      queryStringParams: { v: '1.0.1' } 
    },
    
    detection: {
      // 优先级：1. URL参数(?lang=) -> 2. 本地缓存 -> 3. 浏览器语言 -> 4. 默认英文
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
      // 自动处理类似 en-US 为 en
      convertDetectedLanguage: (lng) => lng.replace(/-.*/, ''),
    },

    // 允许部分加载
    partialBundledLanguages: true,
    
    // 确保首屏加载时不会因为等待翻译文件而导致空白，配合 Suspense 使用
    react: {
      useSuspense: true
    }
  });

export default i18n;