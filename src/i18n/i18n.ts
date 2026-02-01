import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

// 你真实支持的语言列表
const SUPPORTED_LANGS = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ar', 'th', 'id', 'ms', 'ru'];

const getInitialLanguage = () => {
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get('lang');

  if (langParam) {
    // 统一处理 en-US / zh-CN / zh_CN
    const cleanLang = langParam.toLowerCase().split(/[-_]/)[0];

    if (SUPPORTED_LANGS.includes(cleanLang)) {
      localStorage.setItem('i18nextLng', cleanLang);
      return cleanLang;
    }
  }

  // 🔒 绝对默认：英文
  return 'en';
};

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}.json',
      queryStringParams: { v: '1.0.1' },
    },

    react: {
      useSuspense: true,
    },
  });

// 用户明确切换语言时才持久化
i18n.on('languageChanged', (lng) => {
  if (SUPPORTED_LANGS.includes(lng)) {
    localStorage.setItem('i18nextLng', lng);
  }
});

export default i18n;
