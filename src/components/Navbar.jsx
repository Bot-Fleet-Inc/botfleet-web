import './Navbar.css'

export function Navbar({ lang, onLangToggle }) {
  return (
    <nav className="navbar" aria-label="Main navigation">
      <a href="/" className="navbar__brand">
        <span className="navbar__logo">BFI</span>
      </a>
      <div className="navbar__links">
        <a href="#the-team" className="navbar__link">
          {lang === 'no' ? 'Flåten' : 'The Fleet'}
        </a>
        <a
          href="https://github.com/Bot-Fleet-Inc"
          className="navbar__link"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
        <button className="navbar__lang-btn" onClick={onLangToggle} aria-label="Toggle language">
          {lang === 'no' ? '🇬🇧 EN' : '🇳🇴 NO'}
        </button>
      </div>
    </nav>
  )
}
