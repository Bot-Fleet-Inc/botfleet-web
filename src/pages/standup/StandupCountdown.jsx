/**
 * StandupCountdown — countdown timer to next standup
 */
import './StandupCountdown.css'

export function StandupCountdown({ countdownMs, phase }) {
  const total   = 5 * 60 * 1000
  const percent = Math.min(100, Math.max(0, ((total - countdownMs) / total) * 100))

  const secs = Math.ceil(countdownMs / 1000)
  const mm   = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss   = String(secs % 60).padStart(2, '0')

  const isActive = phase !== 'idle'

  return (
    <div className={`standup-countdown ${isActive ? 'standup-countdown--active' : ''}`}>
      <div className="countdown-label">
        {isActive ? 'Standup in progress' : 'Next standup in'}
      </div>

      <div className="countdown-timer" aria-live="polite">
        {isActive ? (
          <span className="countdown-live">🟢 Live</span>
        ) : (
          <span className="countdown-digits">{mm}:{ss}</span>
        )}
      </div>

      {/* Progress arc */}
      <div className="countdown-bar" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
        <div className="countdown-bar__fill" style={{ width: `${percent}%` }} />
      </div>

      <div className="countdown-cron">
        <code>*/5 * * * *</code>
      </div>
    </div>
  )
}
