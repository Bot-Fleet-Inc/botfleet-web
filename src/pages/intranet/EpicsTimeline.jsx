import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEpics } from '../../hooks/useEpics.js';
import './EpicsTimeline.css';

const LABEL_COLOR_MAP = {
  'type:epic': null,         // don't badge this one
  'priority:high':  '#F85149',
  'priority:medium':'#E3B341',
  'env:dev':        '#3FB950',
  'env:stage':      '#58A6FF',
  'env:prod':       '#F78166',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function EpicsTimeline() {
  const { t } = useTranslation();
  const { epics, loading, error } = useEpics();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all'); // all | open | closed

  const filtered = epics.filter((e) => {
    if (filter === 'open')   return e.state === 'OPEN';
    if (filter === 'closed') return e.state === 'CLOSED';
    return true;
  });

  // Sort: open first (by createdAt desc), then closed (by closedAt desc)
  const sorted = [...filtered].sort((a, b) => {
    if (a.state !== b.state) return a.state === 'OPEN' ? -1 : 1;
    const aDate = a.state === 'OPEN' ? a.createdAt : (a.closedAt ?? a.updatedAt);
    const bDate = b.state === 'OPEN' ? b.createdAt : (b.closedAt ?? b.updatedAt);
    return new Date(bDate) - new Date(aDate);
  });

  const selectedEpic = selected !== null ? epics.find((e) => e.number === selected) : null;

  return (
    <main className="epics-timeline">
      <div className="epics-timeline__layout">
        {/* ── Left panel: timeline ── */}
        <section className="epics-timeline__panel" aria-label="Epics timeline">
          <header className="epics-timeline__header">
            <div>
              <Link to="/intranet" className="epics-timeline__back">← Fleet overview</Link>
              <h1 className="epics-timeline__title">Epics Timeline</h1>
              <p className="epics-timeline__subtitle">
                All executive board epics — open and completed.
              </p>
            </div>

            {/* Filter tabs */}
            <div className="epics-timeline__filters" role="tablist" aria-label="Filter epics">
              {['all', 'open', 'closed'].map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  className={`epics-timeline__filter-tab ${filter === f ? 'epics-timeline__filter-tab--active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className="epics-timeline__filter-count">
                    {f === 'all' ? epics.length
                      : f === 'open' ? epics.filter(e => e.state === 'OPEN').length
                      : epics.filter(e => e.state === 'CLOSED').length}
                  </span>
                </button>
              ))}
            </div>
          </header>

          {loading && (
            <div className="epics-timeline__loading">
              <span className="spinner" /> Loading epics…
            </div>
          )}
          {error && <p className="epics-timeline__error">{error}</p>}

          {/* Timeline */}
          <div className="epics-timeline__list" role="list">
            {sorted.map((epic, idx) => {
              const isOpen = epic.state === 'OPEN';
              const isSelected = selected === epic.number;
              const visibleLabels = epic.labels
                .filter((l) => l.name !== 'type:epic' && LABEL_COLOR_MAP[l.name] !== null)
                .slice(0, 3);

              return (
                <div
                  key={epic.number}
                  role="listitem"
                  className={`epics-timeline__item ${isOpen ? 'epics-timeline__item--open' : 'epics-timeline__item--closed'} ${isSelected ? 'epics-timeline__item--selected' : ''}`}
                  onClick={() => setSelected(isSelected ? null : epic.number)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelected(isSelected ? null : epic.number)}
                  aria-selected={isSelected}
                >
                  <div className="epics-timeline__item-track">
                    <div className={`epics-timeline__dot epics-timeline__dot--${isOpen ? 'open' : 'closed'}`} />
                    {idx < sorted.length - 1 && <div className="epics-timeline__line" />}
                  </div>

                  <div className="epics-timeline__item-body">
                    <div className="epics-timeline__item-header">
                      <span className="epics-timeline__item-number">#{epic.number}</span>
                      <span className={`epics-timeline__status epics-timeline__status--${isOpen ? 'open' : 'closed'}`}>
                        {isOpen ? 'Open' : 'Done'}
                      </span>
                    </div>

                    <h3 className="epics-timeline__item-title">{epic.title}</h3>

                    <div className="epics-timeline__item-meta">
                      <span className="epics-timeline__date">
                        {isOpen
                          ? `Started ${formatDate(epic.createdAt)}`
                          : `Closed ${formatDate(epic.closedAt)}`
                        }
                      </span>

                      {visibleLabels.map((l) => (
                        <span
                          key={l.name}
                          className="epics-timeline__label"
                          style={{
                            color: LABEL_COLOR_MAP[l.name] ?? `#${l.color}`,
                            borderColor: LABEL_COLOR_MAP[l.name] ?? `#${l.color}`,
                          }}
                        >
                          {l.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && sorted.length === 0 && (
              <p className="epics-timeline__empty">No epics matching filter.</p>
            )}
          </div>
        </section>

        {/* ── Right panel: detail ── */}
        {selectedEpic && (
          <aside className="epics-timeline__detail" aria-label="Epic detail">
            <button
              className="epics-timeline__detail-close"
              onClick={() => setSelected(null)}
              aria-label="Close detail"
            >
              ✕
            </button>

            <div className="epics-timeline__detail-header">
              <span className="epics-timeline__item-number">#{selectedEpic.number}</span>
              <span className={`epics-timeline__status epics-timeline__status--${selectedEpic.state === 'OPEN' ? 'open' : 'closed'}`}>
                {selectedEpic.state === 'OPEN' ? 'Open' : 'Done'}
              </span>
            </div>

            <h2 className="epics-timeline__detail-title">{selectedEpic.title}</h2>

            <div className="epics-timeline__detail-dates">
              <div>
                <span className="epics-timeline__detail-label">Started</span>
                <span>{formatDate(selectedEpic.createdAt)}</span>
              </div>
              {selectedEpic.closedAt && (
                <div>
                  <span className="epics-timeline__detail-label">Closed</span>
                  <span>{formatDate(selectedEpic.closedAt)}</span>
                </div>
              )}
            </div>

            {selectedEpic.assignees?.length > 0 && (
              <div className="epics-timeline__detail-assignees">
                <span className="epics-timeline__detail-label">Assigned to</span>
                <div className="epics-timeline__assignee-list">
                  {selectedEpic.assignees.map((a) => (
                    <div key={a.login} className="epics-timeline__assignee">
                      <img src={a.avatarUrl} alt={a.login} width={24} height={24} />
                      <span>{a.login}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedEpic.body && (
              <div className="epics-timeline__detail-body">
                <span className="epics-timeline__detail-label">Description</span>
                <p className="epics-timeline__detail-text">
                  {selectedEpic.body.replace(/\n+/g, ' ').slice(0, 400)}
                  {selectedEpic.body.length > 400 && '…'}
                </p>
              </div>
            )}

            <a
              href={selectedEpic.url}
              className="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: '1.5rem', display: 'inline-flex' }}
            >
              View on GitHub ↗
            </a>
          </aside>
        )}
      </div>
    </main>
  );
}
