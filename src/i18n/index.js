import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import no from './locales/no.json';

const STORAGE_KEY = 'bfi-lang';

const savedLang = (() => {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
})();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      no: { translation: no },
    },
    lng: savedLang || 'no',
    fallbackLng: 'no',
    interpolation: { escapeValue: false },
  });

// Persist language choice
i18n.on('languageChanged', (lang) => {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
});

export default i18n;
