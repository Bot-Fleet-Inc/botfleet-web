/**
 * EpicsTimeline — intranet.bot-fleet.org/epics
 * Horizontal right→left timeline of all executive board epics
 * Click epic → detail panel
 * WEB-5
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEpics, STATIC_EPICS } from '../../hooks/useEpics.js'
import './EpicsTimeline.css'

const LABEL_ENV_COLOR = {
  'env:dev':   'var(--color-archi)',
  'env:stage': 'var(--color-coding)',
  'env:prod':  'var(--color-status-error)',
}

const LABEL_STATUS_COLOR = {
  'status:done':        'var(--color-status-online)',
  'status:in-progress': 'var(--color-coding)',
  'status:blocked':     'var(--color-status-error)',
  'status:planned':     'var(--color-text-dim)',
}

function getEnvLabel(labels = []) {
  return labels.find(l => l.startsWith('env:')) ?? null
}

function getStatusLabel(labels = []) {
  return labels.find(l => l.startsWith('status:')) ?? null
}

function EpicDetail({ epic, onClose }) {
  const envLabel = getEnvLabel(epic.labels)
  const statusLabel = getStatusLabel(epic.labels)

  return (
    <aside className="epic-detail" aria-label="Epic detail">
      <button className="epic-detail__close" onClick={onClose} aria-label="Close">✕</button>
      <header className="epic-detail__header">
        <span className="epic-detail__num">#{epic.number}</span>
        {envLabel && (
          <span className="epic-detail__env-badge"
            style={{ '--badge-color': LABEL_ENV_COLOR[envLabel] ?? 'var(--color-text-dim)' }}>
            {envLabel}
          </span>
        )}
      </header>
      <h2 className="epic-detail__title">{epic.title}</h2>
      {statusLabel && (
        <div className="epic-detail__status"
          style={{ '--status-color': LABEL_STATUS_COLOR[statusLabel] ?? 'var(--color-text-dim)' }}>
          <span className="epic-detail__status-dot" />
          {statusLabel.replace('status:', '')}
        </div>
      )}
      <dl className="epic-detail__meta">
        <dt>Created</dt>
        <dd>{new Date(epic.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
        {epic.closedAt && <><dt>Closed</dt><dd>{new Date(epic.closedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</dd></>}
        {epic.linkedBots?.length > 0 && (
          <>
            <dt>Bots</dt>
            <dd className="epic-detail__bots">
              {epic.linkedBots.map(b => (
                <Link key={b} to={`/intranet/bots/${b}`} className="epic-detail__bot-link">
                  {b.replace('-bot', '')}
                </Link>
              ))}
            </dd>
          </>
        )}
      </dl>
      <a href={epic.url} target="_blank" rel="noopener noreferrer" className="epic-detail__gh-link">
        View on GitHub ↗
      </a>
    </aside>
  )
}

export function EpicsTimeline() {
  const { t } = useTranslation()
  const { epics, loading, error } = useEpics()
  const [selected, setSelected] = useState(null)
  const displayEpics = loading ? STATIC_EPICS : epics

  // Sort newest → oldest (right→left on screen means index 0 = rightmost/newest)
  const sorted = [...displayEpics].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <main className="epics-timeline-page">
      <header className="epics-timeline-page__header">
        <Link to="/intranet" className="epics-back">← Fleet ops</Link>
        <h1 className="epics-timeline-page__title">Epics Timeline</h1>
        <p className="epics-timeline-page__sub">
          {loading ? 'Loading…' : `${displayEpics.length} epic${displayEpics.length !== 1 ? 's' : ''} — scroll right→left for oldest`}
        </p>
      </header>

      <div className="epics-timeline-wrap">
        {loading ? (
          <span className="spinner" style={{ margin: '4rem auto', display: 'block', width: 16 }} />
        ) : error ? (
          <p className="epics-error">Failed to load epics: {error}</p>
        ) : (
          <div className="epics-timeline" role="list">
            {/* Rail */}
            <div className="epics-timeline__rail" aria-hidden="true" />

            {sorted.map((epic, i) => {
              const envLabel = getEnvLabel(epic.labels)
              const statusLabel = getStatusLabel(epic.labels)
              const isOpen = epic.state === 'open'
              const isSelected = selected?.number === epic.number
              const staggerUp = i % 2 === 0

              return (
                <div
                  key={epic.number}
                  className={`epic-card${staggerUp ? ' epic-card--up' : ' epic-card--down'}${isSelected ? ' epic-card--selected' : ''}`}
                  role="listitem"
                  style={{ '--epic-env-color': LABEL_ENV_COLOR[envLabel] ?? 'var(--color-coding)' }}
                >
                  {/* Connector dot on rail */}
                  <div className="epic-card__dot" aria-hidden="true" />

                  <button
                    className="epic-card__btn"
                    onClick={() => setSelected(isSelected ? null : epic)}
                    aria-expanded={isSelected}
                    aria-label={`Epic #${epic.number}: ${epic.title}`}
                  >
                    <span className="epic-card__num">#{epic.number}</span>
                    <span className="epic-card__title">{epic.title}</span>
                    <div className="epic-card__badges">
                      {envLabel && (
                        <span className="epic-card__badge"
                          style={{ color: LABEL_ENV_COLOR[envLabel] ?? 'var(--color-text-dim)' }}>
                          {envLabel}
                        </span>
                      )}
                      {statusLabel && (
                        <span className="epic-card__badge"
                          style={{ color: LABEL_STATUS_COLOR[statusLabel] ?? 'var(--color-text-dim)' }}>
                          {statusLabel.replace('status:', '')}
                        </span>
                      )}
                    </div>
                    <span className="epic-card__date">
                      {new Date(epic.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && <EpicDetail epic={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}
