import { useTranslation } from 'react-i18next';
import './LangToggle.css';

export function LangToggle() {
  const { i18n } = useTranslation();
  const isNo = i18n.language === 'no';

  return (
    <button
      className="lang-toggle"
      onClick={() => i18n.changeLanguage(isNo ? 'en' : 'no')}
      aria-label={isNo ? 'Switch to English' : 'Bytt til norsk'}
      title={isNo ? 'Switch to English' : 'Bytt til norsk'}
    >
      {isNo ? '🇬🇧 EN' : '🇳🇴 NO'}
    </button>
  );
}
