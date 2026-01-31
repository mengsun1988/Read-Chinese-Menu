import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入英文包
import enPayload from '../../public/locales/en.json';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    // 关键点 1：初始语言设置为 en 时，直接使用内存中的资源
    // 这样加载首页（英文）就不需要发起 HTTP 请求
    resources: {
      en: { translation: enPayload }
    },
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      // 关键点 2：确保路径绝对正确
      loadPath: '/locales/{{lng}}.json',
      // 防止缓存导致切换不及时
      queryStringParams: { v: '1.0.0' } 
    },
    detection: {
      // 关键点 3：必须把 querystring 放在第一位，才能响应 ?lang= 变化
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
      convertDetectedLanguage: (lng) => lng.replace(/-.*/, ''),
    },
    // 允许在没有加载完所有资源时渲染 fallbackLng
    partialBundledLanguages: true,
  });

export default i18n;