import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// 路径解释：从 src/i18n/ 向上退两级到根目录，再进入 public
import enPayload from '../../public/locales/en.json'; 

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // 关键优化：预载英文，消除首屏白屏
    resources: {
      en: { translation: enPayload }
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      // 其他语言依然按需从服务器加载
      loadPath: '/locales/{{lng}}.json',
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
      convertDetectedLanguage: (lng) => lng.replace(/-.*/, ''),
    },
    react: {
      // 英文环境现在无需等待，直接渲染
      useSuspense: true, 
    },
  });

export default i18n;