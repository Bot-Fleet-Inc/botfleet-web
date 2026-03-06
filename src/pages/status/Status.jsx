import { useTranslation } from 'react-i18next';
import { useStatus } from '../../hooks/useStatus.js';
import './Status.css';

const BOT_COLORS = {
  'dispatch-bot': 'var(--color-dispatch)',
  'design-bot':   'var(--color-design)',
  'coding-bot':   'var(--color-coding)',
  'archi-bot':    'var(--color-archi)',
  'infra-bot':    'var(--color-infra)',
};

const BOT_DISPLAY_NAMES = {
  'dispatch-bot': 'Dispatch',
  'design-bot':   'Design',
  'coding-bot':   'Coding',
  'archi-bot':    'Archi',
  'infra-bot':    'Infra',
};

function StatusIndicator({ status }) {
  const cls =
    status === 'ok' || status === 'online' ? 'indicator--ok'
    : status === 'warn' || status === 'degraded' ? 'indicator--warn'
    : 'indicator--down';
  return <span className={`indicator ${cls}`} aria-hidden="true" />;
}

function OverallBanner({ status }) {
  const message =
    status === 'ok'       ? 'All systems operational'
    : status === 'degraded' ? 'Partial degradation'
    : status === 'down'     ? 'System outage'
    : 'Checking…';

  const cls =
    status === 'ok'       ? 'banner--ok'
    : status === 'degraded' ? 'banner--warn'
    : 'banner--down';

  return (
    <div className={`status-banner ${cls}`} role="status" aria-live="polite">
      <StatusIndicator status={status} />
      <span className="status-banner__text">{message}</span>
    </div>
  );
}

function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatResetIn(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function Status() {
  const { github, workers, bots, lastUpdated, loading, errors, refresh } = useStatus();

  // Derive overall status
  const statuses = [
    github?.status,
    workers?.status,
    bots?.status,
  ].filter(Boolean);

  const overall =
    !statuses.length ? 'unknown'
    : statuses.every((s) => s === 'ok') ? 'ok'
    : statuses.some((s) => s === 'down' || s === 'critical') ? 'down'
    : 'degraded';

  return (
    <main className="status-page">
      <header className="status-page__header">
        <h1 className="status-page__title">
          <span className="status-page__title-prefix">status.</span>bot-fleet.org
        </h1>
        <div className="status-page__meta">
          {lastUpdated && (
            <span className="status-page__updated">
              Last updated: {formatTime(lastUpdated)}
            </span>
          )}
          <button
            className="status-page__refresh"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh status"
          >
            {loading ? '⟳ Refreshing…' : '⟳ Refresh'}
          </button>
          <span className="status-page__poll-hint">Auto-refreshes every 60s</span>
        </div>
      </header>

      <OverallBanner status={overall} />

      {/* ── Bot Fleet Health ── */}
      <section className="status-section">
        <h2 className="status-section__title">Bot Fleet</h2>

        {errors.bots && (
          <p className="status-error">Failed to reach fleet health endpoint: {errors.bots}</p>
        )}

        <div className="status-grid">
          {bots
            ? bots.bots.map((bot) => (
                <div
                  key={bot.bot}
                  className={`status-card ${bot.status === 'online' ? 'status-card--ok' : bot.status === 'offline' ? 'status-card--down' : 'status-card--warn'}`}
                  style={{ '--bot-color': BOT_COLORS[bot.bot] ?? 'var(--color-coding)' }}
                >
                  <div className="status-card__header">
                    <span className="status-card__name">
                      {BOT_DISPLAY_NAMES[bot.bot] ?? bot.bot}
                    </span>
                    <StatusIndicator status={bot.status === 'online' ? 'ok' : bot.status === 'offline' ? 'down' : 'warn'} />
                  </div>
                  <div className="status-card__body">
                    <span className={`status-card__label status-card__label--${bot.status === 'online' ? 'ok' : bot.status === 'offline' ? 'down' : 'warn'}`}>
                      {bot.status === 'online' ? 'Online' : bot.status === 'offline' ? 'Offline' : 'Error'}
                    </span>
                    {bot.latencyMs != null && (
                      <span className="status-card__latency">{bot.latencyMs}ms</span>
                    )}
                    {bot.error && (
                      <span className="status-card__error" title={bot.error}>unreachable</span>
                    )}
                  </div>
                </div>
              ))
            : !loading && (
              // Static fallback bot cards
              ['dispatch-bot', 'design-bot', 'coding-bot', 'archi-bot', 'infra-bot'].map((name) => (
                <div
                  key={name}
                  className="status-card status-card--unknown"
                  style={{ '--bot-color': BOT_COLORS[name] }}
                >
                  <div className="status-card__header">
                    <span className="status-card__name">{BOT_DISPLAY_NAMES[name]}</span>
                    <StatusIndicator status="unknown" />
                  </div>
                  <div className="status-card__body">
                    <span className="status-card__label status-card__label--unknown">Unknown</span>
                  </div>
                </div>
              ))
            )
          }
        </div>

        {bots && (
          <p className="status-section__summary">{bots.summary}</p>
        )}
      </section>

      {/* ── GitHub API ── */}
      <section className="status-section">
        <h2 className="status-section__title">GitHub API</h2>

        {errors.github && (
          <p className="status-error">Failed to reach GitHub status endpoint: {errors.github}</p>
        )}

        {github && (
          <div className="status-detail-card">
            <div className="status-detail-card__header">
              <div className="status-detail-card__title">
                <StatusIndicator status={github.status} />
                <span>Core API</span>
              </div>
              <span className={`status-detail-card__badge status-detail-card__badge--${github.status}`}>
                {github.status === 'ok' ? 'Healthy' : github.status === 'warn' ? 'Warning' : 'Critical'}
              </span>
            </div>

            <div className="status-detail-card__stats">
              <div className="status-stat">
                <span className="status-stat__label">Rate Limit</span>
                <span className="status-stat__value">{github.core.limit.toLocaleString()}/hr</span>
              </div>
              <div className="status-stat">
                <span className="status-stat__label">Remaining</span>
                <span className={`status-stat__value ${github.core.percent < 20 ? 'status-stat__value--warn' : ''}`}>
                  {github.core.remaining.toLocaleString()} ({github.core.percent}%)
                </span>
              </div>
              <div className="status-stat">
                <span className="status-stat__label">Resets in</span>
                <span className="status-stat__value">{formatResetIn(github.core.resetIn)}</span>
              </div>
            </div>

            {/* Rate gauge */}
            <div className="status-gauge" aria-label={`GitHub API ${github.core.percent}% remaining`}>
              <div
                className={`status-gauge__fill ${github.core.percent < 20 ? 'status-gauge__fill--warn' : ''}`}
                style={{ width: `${github.core.percent}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Cloudflare Workers ── */}
      <section className="status-section">
        <h2 className="status-section__title">Cloudflare Workers</h2>

        {errors.workers && (
          <p className="status-error">Failed to reach Workers health endpoint: {errors.workers}</p>
        )}

        {workers && (
          <div className="status-detail-card">
            <div className="status-detail-card__header">
              <div className="status-detail-card__title">
                <StatusIndicator status={workers.status} />
                <span>botfleet-web Worker</span>
              </div>
              <span className={`status-detail-card__badge status-detail-card__badge--${workers.status}`}>
                {workers.status === 'ok' ? 'Operational' : workers.status === 'degraded' ? 'Degraded' : 'Down'}
              </span>
            </div>

            <div className="status-detail-card__stats">
              <div className="status-stat">
                <span className="status-stat__label">Latency</span>
                <span className="status-stat__value">{workers.latencyMs}ms</span>
              </div>
            </div>

            <div className="status-checks">
              {Object.entries(workers.checks).map(([key, check]) => (
                <div key={key} className={`status-check ${check.ok ? 'status-check--ok' : 'status-check--down'}`}>
                  <StatusIndicator status={check.ok ? 'ok' : 'down'} />
                  <span className="status-check__name">{key.replace(/_/g, ' ')}</span>
                  {check.error && (
                    <span className="status-check__error" title={check.error}>⚠</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
