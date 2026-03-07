/**
 * Dagbok — Company journal, prev/next page navigation
 * WEB-16: Living history of Bot Fleet Inc
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import journal from '../data/journal.json';
import './Dagbok.css';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function DagbokEntry({ entry, showNav = true, compact = false }) {
  const idx = journal.findIndex(e => e.id === entry.id);
  const prev = journal[idx + 1] || null;
  const next = journal[idx - 1] || null;

  if (compact) {
    return (
      <article className="dagbok-card">
        <time className="dagbok-card__date" dateTime={entry.date}>{formatDate(entry.date)}</time>
        <h3 className="dagbok-card__title">{entry.title}</h3>
        <p className="dagbok-card__body">{entry.body}</p>
      </article>
    );
  }

  return (
    <article className="dagbok-entry">
      <div className="dagbok-entry__header">
        <time className="dagbok-entry__date" dateTime={entry.date}>{formatDate(entry.date)}</time>
        <div className="dagbok-entry__tags">
          {entry.tags.map(t => <span key={t} className="dagbok-tag">{t}</span>)}
        </div>
      </div>

      {entry.image && (
        <div className="dagbok-entry__image-wrap">
          <img src={entry.image} alt={entry.title} className="dagbok-entry__image pixel-art" />
        </div>
      )}

      <h1 className="dagbok-entry__title">{entry.title}</h1>
      <p className="dagbok-entry__body">{entry.body}</p>

      {showNav && (
        <nav className="dagbok-nav" aria-label="Navigasjon i dagbok">
          <div className="dagbok-nav__prev">
            {prev ? (
              <Link to={`/dagbok/${prev.id}`} className="dagbok-nav__link">
                ← {prev.title}
              </Link>
            ) : <span />}
          </div>
          <Link to="/dagbok" className="dagbok-nav__index">alle oppføringer</Link>
          <div className="dagbok-nav__next">
            {next ? (
              <Link to={`/dagbok/${next.id}`} className="dagbok-nav__link dagbok-nav__link--next">
                {next.title} →
              </Link>
            ) : <span />}
          </div>
        </nav>
      )}
    </article>
  );
}

export function Dagbok() {
  const [current, setCurrent] = useState(0);
  const entry = journal[current];
  const prev = journal[current + 1] || null;
  const next = journal[current - 1] || null;

  return (
    <main className="dagbok-page">
      <div className="dagbok-page__inner">
        <header className="dagbok-header">
          <Link to="/" className="dagbok-header__back">← Hjem</Link>
          <h2 className="dagbok-header__title">📖 Dagbok</h2>
          <p className="dagbok-header__sub">Bot Fleet Inc — fra stiftelsen til nå</p>
        </header>

        <article className="dagbok-entry">
          <div className="dagbok-entry__header">
            <time className="dagbok-entry__date" dateTime={entry.date}>{formatDate(entry.date)}</time>
            <div className="dagbok-entry__tags">
              {entry.tags.map(t => <span key={t} className="dagbok-tag">{t}</span>)}
            </div>
          </div>

          {entry.image && (
            <div className="dagbok-entry__image-wrap">
              <img src={entry.image} alt={entry.title} className="dagbok-entry__image pixel-art" />
            </div>
          )}

          <h1 className="dagbok-entry__title">{entry.title}</h1>
          <p className="dagbok-entry__body">{entry.body}</p>
        </article>

        <nav className="dagbok-nav" aria-label="Navigasjon i dagbok">
          <button
            className="dagbok-nav__link"
            onClick={() => prev && setCurrent(current + 1)}
            disabled={!prev}
            aria-label="Forrige oppføring"
          >
            {prev ? `← ${prev.title}` : ''}
          </button>

          <span className="dagbok-nav__counter">{current + 1} / {journal.length}</span>

          <button
            className="dagbok-nav__link dagbok-nav__link--next"
            onClick={() => next && setCurrent(current - 1)}
            disabled={!next}
            aria-label="Neste oppføring"
          >
            {next ? `${next.title} →` : ''}
          </button>
        </nav>
      </div>
    </main>
  );
}
