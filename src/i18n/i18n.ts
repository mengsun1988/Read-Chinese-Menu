import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpApi) // 允许从服务器/本地文件夹加载 JSON
  .use(LanguageDetector) // 自动检测浏览器语言
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React 已经自带防 XSS 攻击，所以这里设为 false
    },
    backend: {
      // 关键：告诉 i18n 去哪里找你的 json 文件
      loadPath: '/locales/{{lng}}.json',
    },
    react: {
      useSuspense: true, // 必须配合 index.tsx 里的 Suspense 使用
    }
  });

export default i18n;