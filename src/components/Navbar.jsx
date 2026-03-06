import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LangToggle } from './LangToggle.jsx';
import './Navbar.css';

export function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="navbar" aria-label="Main navigation">
      <Link to="/" className="navbar__wordmark" aria-label="Bot Fleet Inc">
        BFI
      </Link>

      <ul className="navbar__links" role="list">
        <li>
          <Link
            to="/"
            className={`navbar__link ${pathname === '/' ? 'navbar__link--active' : ''}`}
          >
            {t('nav.home')}
          </Link>
        </li>
        <li>
          <Link
            to="/the-team"
            className={`navbar__link ${pathname === '/the-team' ? 'navbar__link--active' : ''}`}
          >
            {t('nav.theTeam')}
          </Link>
        </li>
        <li>
          <Link
            to="/updates"
            className={`navbar__link ${pathname === '/updates' ? 'navbar__link--active' : ''}`}
          >
            {t('nav.updates')}
          </Link>
        </li>
        <li>
          <Link
            to="/intranet"
            className={`navbar__link navbar__link--external ${pathname.startsWith('/intranet') ? 'navbar__link--active' : ''}`}
          >
            {t('nav.intranet')}
          </Link>
        </li>
        <li>
          <a
            href="https://status.bot-fleet.org"
            className="navbar__link navbar__link--external"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('nav.status')}
          </a>
        </li>
      </ul>

      <LangToggle />
    </nav>
  );
}
