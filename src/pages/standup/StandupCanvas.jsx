/**
 * StandupCanvas — live bot landscape for the hero section (WEB-26).
 *
 * Bots are positioned at workstation coords (% of canvas).
 * During standup phases they animate toward a circle center.
 * Sprites served from R2 CDN.
 *
 * Phase behaviour:
 *   idle        → bots at workstations (spread positions)
 *   gathering   → bots animate toward standup circle center
 *   standup     → bots visible in circle, issue bubble shown
 *   dispersing  → bots animate back to workstations
 */

import { useMemo } from 'react'
import './StandupCanvas.css'

const SPRITE_BASE = 'https://pub-9d8a85e5e17847949d36335948eeaee0.r2.dev/sprites'

// ─── Workstation positions (% of canvas) ───────────────────────────────────
const WORKSTATION_POSITIONS = {
  dispatch: { x: 10, y: 12 },
  design:   { x: 28, y: 25 },
  coding:   { x: 12, y: 42 },
  audit:    { x: 62, y: 68 },
  archi:    { x: 72, y: 15 },
  infra:    { x: 55, y: 82 },
}

// Lounge positions (idle bots go here)
const LOUNGE_POSITIONS = {
  dispatch: { x: 58, y: 62 },
  design:   { x: 72, y: 72 },
  coding:   { x: 60, y: 78 },
  audit:    { x: 75, y: 62 },
  archi:    { x: 65, y: 85 },
  infra:    { x: 80, y: 78 },
}

// Standup circle
const CIRCLE_CENTER = { x: 50, y: 45 }
const CIRCLE_RADIUS = 14 // percent

function circlePosition(index, total) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return {
    x: CIRCLE_CENTER.x + CIRCLE_RADIUS * Math.cos(angle),
    y: CIRCLE_CENTER.y + CIRCLE_RADIUS * Math.sin(angle),
  }
}

/** Map standupStatus → R2 sprite URL */
function spriteUrl(botId, standupStatus) {
  const stateMap = {
    active:  { state: 'working',   ext: 'gif' },
    blocked: { state: 'attention', ext: 'gif' },
    idle:    { state: 'idle',      ext: 'gif' },
    loading: { state: 'rest',      ext: 'png' },
    unknown: { state: 'rest',      ext: 'png' },
  }
  const { state, ext } = stateMap[standupStatus] ?? { state: 'rest', ext: 'png' }
  return `${SPRITE_BASE}/${botId}-${state}.${ext}`
}

/** Fallback if sprite fails to load — try idle, then rest */
function fallbackSrc(botId, current) {
  if (current.includes('working') || current.includes('attention')) {
    return `${SPRITE_BASE}/${botId}-idle.gif`
  }
  if (current.includes('idle')) {
    return `${SPRITE_BASE}/${botId}-rest.png`
  }
  return null // give up
}

export function StandupCanvas({ bots = [], phase = 'idle' }) {
  const positions = useMemo(() => {
    return bots.map((bot, i) => {
      const workstation = WORKSTATION_POSITIONS[bot.id] ?? { x: 25, y: 25 }
      const lounge      = LOUNGE_POSITIONS[bot.id] ?? { x: 70, y: 70 }
      const circle      = circlePosition(i, bots.length)
      const inCircle    = phase === 'standup' || phase === 'gathering'
      const isIdle      = bot.standupStatus === 'idle' || bot.standupStatus === 'loading' || bot.standupStatus === 'unknown'
      return {
        ...bot,
        pos: inCircle ? circle : (isIdle ? lounge : workstation),
      }
    })
  }, [bots, phase])

  return (
    <div className="standup-canvas" role="img" aria-label="Bot Fleet — live workspace">
      <div className="standup-canvas__grid" />
      {/* Room zones */}
      <div className="standup-canvas__zone standup-canvas__zone--work" />
      <div className="standup-canvas__zone standup-canvas__zone--lounge" />
      <div className="standup-canvas__zone standup-canvas__zone--standup" />
      {/* Room labels */}
      <span className="standup-canvas__room standup-canvas__room--hq">⬡ BOT FLEET HQ</span>
      <span className="standup-canvas__room standup-canvas__room--work">🖥 Workstations</span>
      <span className="standup-canvas__room standup-canvas__room--lounge">☕ Lounge</span>
      <span className="standup-canvas__room standup-canvas__room--standup">◎ Standup</span>
      {/* Grid background */}
      <div className="standup-canvas__grid" />

      {/* Room labels */}
      <span className="standup-canvas__room standup-canvas__room--hq">🏢 Bot Fleet HQ</span>
      <span className="standup-canvas__room standup-canvas__room--standup">Standup</span>
      <span className="standup-canvas__room standup-canvas__room--lounge">Lounge</span>

      {/* Standup circle indicator */}
      {(phase === 'standup' || phase === 'gathering' || phase === 'dispersing') && (
        <div
          className="standup-canvas__circle"
          style={{
            left:      `${CIRCLE_CENTER.x}%`,
            top:       `${CIRCLE_CENTER.y}%`,
            width:     `${CIRCLE_RADIUS * 2 * 1.3}%`,
            height:    `${CIRCLE_RADIUS * 2 * 1.3}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* Bot avatars */}
      {positions.map((bot) => (
        <BotAvatar key={bot.id} bot={bot} phase={phase} />
      ))}
    </div>
  )
}

function BotAvatar({ bot, phase }) {
  const isInCircle = phase === 'standup' || phase === 'gathering'
  const src = spriteUrl(bot.id, bot.standupStatus)

  function handleError(e) {
    const fb = fallbackSrc(bot.id, e.target.src)
    if (fb && fb !== e.target.src) {
      e.target.src = fb
    } else {
      e.target.style.display = 'none'
      const fallback = e.target.nextSibling
      if (fallback) fallback.style.display = 'flex'
    }
  }

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
      <div className="bot-avatar__sprite-wrap">
        <img
          src={src}
          alt={bot.displayName}
          className="bot-avatar__sprite pixel-art"
          onError={handleError}
        />
        {/* Emoji fallback if all sprite URLs fail */}
        <div className="bot-avatar__emoji-fallback" aria-hidden="true" style={{ display: 'none' }}>
          {bot.emoji ?? '🤖'}
        </div>

        {/* Status dot */}
        <span
          className="bot-avatar__dot"
          data-status={bot.standupStatus}
          aria-hidden="true"
        />
      </div>

      <span className="bot-avatar__name">{bot.displayName}</span>

      {/* Issue bubble — only during standup */}
      {isInCircle && bot.currentIssues?.[0] && (
        <span className="bot-avatar__issue">
          #{bot.currentIssues[0].number}
        </span>
      )}
    </div>
  )
}
