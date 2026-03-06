/**
 * StatusPage — status.bot-fleet.org
 * Fleet health: bot uptime, GitHub API rate limit, CF Workers health
 * Auto-refreshes every 60s
 * WEB-7
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './StatusPage.css'

const REFRESH_INTERVAL = 60_000 // 60s

function useStatusData() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState(null)
  const [error, setError]   = useState(null)

  async function fetch_() {
    try {
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setLastChecked(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch_()
    const timer = setInterval(fetch_, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return { data, loading, error, lastChecked, refresh: fetch_ }
}

const STATUS_LEVEL = { ok: 'ok', warn: 'warn', error: 'error', unknown: 'unknown' }

function StatusIndicator({ level, label, detail }) {
  return (
    <div className={`status-row status-row--${level ?? 'unknown'}`}>
      <div className="status-row__dot" aria-hidden="true" />
      <div className="status-row__content">
        <span className="status-row__label">{label}</span>
        {detail && <span className="status-row__detail">{detail}</span>}
      </div>
      <span className="status-row__badge">{level?.toUpperCase() ?? 'UNKNOWN'}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="status-section">
      <h2 className="status-section__title">{title}</h2>
      <div className="status-section__rows">{children}</div>
    </section>
  )
}

// Derive status level from GitHub rate limit remaining
function ghRateLevel(remaining) {
  if (remaining == null) return STATUS_LEVEL.unknown
  if (remaining > 1000)  return STATUS_LEVEL.ok
  if (remaining > 200)   return STATUS_LEVEL.warn
  return STATUS_LEVEL.error
}

export function StatusPage() {
  const { t } = useTranslation()
  const { data, loading, error, lastChecked, refresh } = useStatusData()

  const bots = data?.bots ?? []
  const gh   = data?.github ?? {}
  const cf   = data?.workers ?? {}

  const overallOk = !error && bots.every(b => b.status === 'ok' || b.status === 'online')

  return (
    <main className="status-page">
      <header className="status-page__header">
        <h1 className="status-page__title">
          <span className={`status-page__overall-dot status-page__overall-dot--${overallOk ? 'ok' : (error ? 'error' : 'warn')}`} aria-hidden="true" />
          Fleet Status
        </h1>
        <p className="status-page__sub">
          {loading ? 'Checking systems…' : error ? 'Partial data — API unreachable' : 'All systems monitored'}
        </p>
        <div className="status-page__meta">
          {lastChecked && (
            <span className="status-page__checked">
              Last checked: {lastChecked.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button className="status-page__refresh" onClick={refresh} aria-label="Refresh status">
            ↺
          </button>
        </div>
      </header>

      {loading && (
        <div className="status-page__loading">
          <span className="spinner" />
        </div>
      )}

      {!loading && (
        <>
          {/* Bot Fleet Health */}
          <Section title="Bot Fleet Health">
            {bots.length === 0 ? (
              <StatusIndicator level="unknown" label="Fleet data unavailable" detail="Requires dispatch-bot health aggregation" />
            ) : (
              bots.map(bot => (
                <StatusIndicator
                  key={bot.name}
                  level={bot.status === 'ok' || bot.status === 'online' ? 'ok' : bot.status === 'degraded' ? 'warn' : 'error'}
                  label={bot.displayName ?? bot.name}
                  detail={bot.detail ?? (bot.lastHeartbeat ? `Last heartbeat: ${new Date(bot.lastHeartbeat).toLocaleTimeString('en-GB')}` : null)}
                />
              ))
            )}
          </Section>

          {/* GitHub API */}
          <Section title="GitHub API">
            <StatusIndicator
              level={ghRateLevel(gh.rateLimit?.remaining)}
              label="Rate limit"
              detail={gh.rateLimit ? `${gh.rateLimit.remaining} / ${gh.rateLimit.limit} remaining — resets ${new Date(gh.rateLimit.reset * 1000).toLocaleTimeString('en-GB')}` : 'Unavailable'}
            />
            <StatusIndicator
              level={gh.reachable ? 'ok' : 'error'}
              label="API reachability"
              detail={gh.reachable ? 'api.github.com responding' : 'Not reachable'}
            />
          </Section>

          {/* Cloudflare Workers */}
          <Section title="Cloudflare Workers">
            <StatusIndicator
              level={cf.healthy ? 'ok' : cf.healthy === false ? 'error' : 'unknown'}
              label="Worker health"
              detail={cf.detail ?? 'botfleet-web Worker'}
            />
          </Section>

          {error && (
            <div className="status-page__error">
              <p>⚠ Status API unreachable: {error}</p>
              <p>The <code>/api/status</code> endpoint needs to be implemented in the Worker. Tracking in WEB-7.</p>
            </div>
          )}
        </>
      )}
    </main>
  )
}
