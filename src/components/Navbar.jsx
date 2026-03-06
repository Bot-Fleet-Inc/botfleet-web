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
          <a
            href="https://intranet.bot-fleet.org"
            className="navbar__link navbar__link--external"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('nav.intranet')}
          </a>
        </li>
        <li>
          <Link
            to="/status"
            className={`navbar__link navbar__link--external ${pathname === '/status' ? 'navbar__link--active' : ''}`}
          >
            {t('nav.status')}
          </Link>
        </li>
      </ul>

      <LangToggle />
    </nav>
  );
}
