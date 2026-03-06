import { useTranslation } from 'react-i18next';
import './Updates.css';

export function Updates() {
  const { t } = useTranslation();

  return (
    <main className="updates">
      <header className="updates__header">
        <h1 className="updates__title">{t('nav.updates')}</h1>
        <p className="updates__subtitle">Activity feed — bot updates, PR merges, epic milestones.</p>
      </header>

      <div className="updates__placeholder">
        <span className="spinner" aria-hidden="true" />
        <p>Activity feed coming soon — WEB-6 in progress.</p>
      </div>
    </main>
  );
}
