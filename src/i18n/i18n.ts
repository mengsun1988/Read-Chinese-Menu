import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
    detection: {
      // 1. 按照你的需求设置优先级
      order: ['querystring', 'localStorage', 'navigator'],
      // 2. 指定参数名为 lang
      lookupQuerystring: 'lang',
      // 3. 自动保存用户的选择到 localStorage，下次进来直接用
      caches: ['localStorage'],
      // 4. 强制将 zh-CN 等格式转化为 zh，匹配你的文件名
      convertDetectedLanguage: (lng) => lng.replace(/-.*/, ''),
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;