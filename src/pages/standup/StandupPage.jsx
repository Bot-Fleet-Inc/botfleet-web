/**
 * WEB-9: Standup UI
 * Bots animate to a standup circle every 5 minutes (cron: star-slash-5).
 *
 * NOTE: Excalidraw bot-avatar positions are placeholders until design-bot
 * delivers the final layout (see bot-fleet-continuum#23).
 */

import { useStandup }       from '../../hooks/useStandup.js'
import { useBots }          from '../../hooks/useBots.js'
import { StandupCanvas }    from './StandupCanvas.jsx'
import { StandupCountdown } from './StandupCountdown.jsx'
import './StandupPage.css'

export function StandupPage({ compact = false }) {
  const { bots }                        = useBots()
  const { phase, countdownMs, standupBots } = useStandup(bots)

  return (
    <div className={`standup-page ${compact ? 'standup-page--compact' : ''}`}>
      {!compact && (
        <header className="standup-header">
          <h1 className="standup-title">Fleet Standup</h1>
          <p className="standup-subtitle">
            Every 5 minutes the fleet assembles. <span className="standup-phase-badge" data-phase={phase}>{phaseLabel(phase)}</span>
          </p>
        </header>
      )}

      <div className="standup-body">
        <StandupCanvas bots={standupBots} phase={phase} />

        <aside className="standup-sidebar">
          <StandupCountdown countdownMs={countdownMs} phase={phase} />

          <ul className="standup-roster">
            {standupBots.map((bot) => (
              <li key={bot.id} className="standup-roster-item" data-status={bot.standupStatus}>
                <span className="roster-emoji">{statusEmoji(bot.standupStatus)}</span>
                <span className="roster-name">{bot.displayName}</span>
                <span className="roster-status">{statusLabel(bot.standupStatus)}</span>
                {bot.currentIssues?.[0] && (
                  <a
                    className="roster-issue"
                    href={bot.currentIssues[0].url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    #{bot.currentIssues[0].number}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}

function phaseLabel(phase) {
  switch (phase) {
    case 'gathering':  return '📣 Gathering...'
    case 'standup':    return '🟢 Standup in progress'
    case 'dispersing': return '👋 Dispersing...'
    default:           return '⏳ Waiting for standup'
  }
}

function statusEmoji(status) {
  switch (status) {
    case 'active':  return '🟢'
    case 'idle':    return '🟡'
    case 'blocked': return '🔴'
    default:        return '⚪'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'active':  return 'Active'
    case 'idle':    return 'Idle'
    case 'blocked': return 'Blocked'
    default:        return 'Unknown'
  }
}
