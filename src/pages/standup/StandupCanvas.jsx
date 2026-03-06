/**
 * StandupCanvas — Excalidraw-backed bot visualization for WEB-9.
 *
 * Bot positions are PLACEHOLDER coordinates.
 * design-bot will supply the final layout (bot-fleet-continuum#23).
 *
 * Phase behaviour:
 *   idle       → bots at workstations (spread positions)
 *   gathering  → bots animate toward standup circle center
 *   standup    → bots visible in circle, status visible
 *   dispersing → bots animate back to workstations
 */

import { useMemo } from 'react'
import './StandupCanvas.css'

// ─── Placeholder workstation positions (% of canvas) ───────────────────────
// design-bot: replace with final Excalidraw-derived coordinates
const WORKSTATION_POSITIONS = {
  dispatch: { x: 15, y: 20 },
  design:   { x: 75, y: 15 },
  archi:    { x: 80, y: 70 },
  coding:   { x: 20, y: 75 },
  infra:    { x: 50, y: 85 },
  audit:    { x: 10, y: 50 },
}

// Center of standup circle
const CIRCLE_CENTER = { x: 50, y: 45 }
const CIRCLE_RADIUS = 14 // percent

function circlePosition(index, total) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return {
    x: CIRCLE_CENTER.x + CIRCLE_RADIUS * Math.cos(angle),
    y: CIRCLE_CENTER.y + CIRCLE_RADIUS * Math.sin(angle),
  }
}

export function StandupCanvas({ bots = [], phase }) {
  const positions = useMemo(() => {
    return bots.map((bot, i) => {
      const workstation = WORKSTATION_POSITIONS[bot.id] ?? { x: 50, y: 50 }
      const circle      = circlePosition(i, bots.length)

      const inCircle = phase === 'standup' || phase === 'gathering'
      return {
        ...bot,
        pos: inCircle ? circle : workstation,
      }
    })
  }, [bots, phase])

  return (
    <div className="standup-canvas" role="img" aria-label="Fleet standup visualization">
      {/* Grid background — placeholder for Excalidraw canvas */}
      <div className="standup-canvas__grid" />

      {/* Standup circle indicator */}
      {(phase === 'standup' || phase === 'gathering' || phase === 'dispersing') && (
        <div
          className="standup-canvas__circle"
          style={{
            left:   `${CIRCLE_CENTER.x}%`,
            top:    `${CIRCLE_CENTER.y}%`,
            width:  `${CIRCLE_RADIUS * 2 * 1.3}%`,
            height: `${CIRCLE_RADIUS * 2 * 1.3}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* Bot avatars */}
      {positions.map((bot) => (
        <BotAvatar key={bot.id} bot={bot} phase={phase} />
      ))}

      {/* Design-bot placeholder notice */}
      <div className="standup-canvas__notice">
        🎨 Awaiting design-bot layout (bot-fleet-continuum#23)
      </div>
    </div>
  )
}

function BotAvatar({ bot, phase }) {
  const isInCircle = phase === 'standup' || phase === 'gathering'

  return (
    <div
      className={`bot-avatar bot-avatar--${bot.standupStatus}`}
      style={{
        left:      `${bot.pos.x}%`,
        top:       `${bot.pos.y}%`,
        transform: 'translate(-50%, -50%)',
        '--bot-color': bot.color ?? 'var(--color-text)',
      }}
      title={`${bot.displayName} — ${bot.standupStatus}`}
      aria-label={`${bot.displayName}: ${bot.standupStatus}`}
    >
      <div className="bot-avatar__sprite">
        {/* Sprite: fallback emoji until real sprites are available */}
        <span className="bot-avatar__emoji" aria-hidden="true">
          {bot.emoji ?? '🤖'}
        </span>
      </div>

      <span className="bot-avatar__name">{bot.displayName}</span>

      {/* Status indicator dot */}
      <span
        className="bot-avatar__dot"
        data-status={bot.standupStatus}
        aria-hidden="true"
      />

      {/* Issue bubble — only visible during standup */}
      {isInCircle && bot.currentIssues?.[0] && (
        <span className="bot-avatar__issue">
          #{bot.currentIssues[0].number}
        </span>
      )}
    </div>
  )
}
