/**
 * HQRoom — Full-viewport 2D Bot HQ landscape (WEB-10)
 *
 * The ENTIRE viewport IS the office.
 * Brand content lives inside the room walls — NOT as traditional UI elements:
 *   ✅ "BOT FLEET INC"     → logo sign hung on wall (teal neon glow)
 *   ✅ "Autonom. Omtrent." → chalkboard text (blinking cursor)
 *   ✅ CTAs                → lounge corner ("Meet the Fleet")
 *   ✅ Bot sprites         → animated, move workstation ↔ lounge ↔ standup
 *
 * Design: design-bot WEB-HQ-prototype.html (approved 2026-03-06)
 * Issue:  botfleet-web#29 (WEB-10)
 */

import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LangToggle } from '../components/LangToggle.jsx'
import './HQRoom.css'

const SPRITE_BASE = 'https://pub-9d8a85e5e17847949d36335948eeaee0.r2.dev/sprites'

// ── Bot config ───────────────────────────────────────────────────────────────

const BOT_CONFIG = [
  {
    id: 'dispatch',
    name: 'dispatch-bot',
    displayName: 'Dispatch',
    color: '#4ECDC4',
    emoji: '📋',
    speech: { no: '3 nye issues', en: '3 new issues' },
    workX: 24.5,
  },
  {
    id: 'design',
    name: 'design-bot',
    displayName: 'Design',
    color: '#FF6B8A',
    emoji: '🎨',
    speech: { no: 'v2 er klar ✓', en: 'v2 is ready ✓' },
    workX: 33,
  },
  {
    id: 'coding',
    name: 'coding-bot',
    displayName: 'Coding',
    color: '#FFB347',
    emoji: '💻',
    speech: { no: 'i flytsonen... 🔥', en: 'in flow... 🔥' },
    workX: 42,
  },
  {
    id: 'audit',
    name: 'audit-bot',
    displayName: 'Audit',
    color: '#5CBA8C',
    emoji: '🔍',
    speech: { no: 'sjekker... ✓', en: 'checking... ✓' },
    workX: 13,
  },
]

// Lounge x-positions (right zone)
const LOUNGE_X = { dispatch: 65, design: 72, coding: 68, audit: 76 }

// Standup circle
const STANDUP_CENTER_X = 49 // % from left
const STANDUP_RADIUS   = 8  // vw

function standupPos(index, total) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  const radVw = STANDUP_RADIUS
  return {
    x: STANDUP_CENTER_X + radVw * Math.cos(angle),
  }
}

function getSpriteUrl(botId, status) {
  const table = {
    active:  `${SPRITE_BASE}/${botId}-idle.gif`,
    blocked: `${SPRITE_BASE}/${botId}-idle.gif`,
    idle:    `${SPRITE_BASE}/${botId}-rest.png`,
    planned: `${SPRITE_BASE}/${botId}-rest.png`,
    unknown: `${SPRITE_BASE}/${botId}-rest.png`,
  }
  return table[status] ?? `${SPRITE_BASE}/${botId}-rest.png`
}

// ── Main component ───────────────────────────────────────────────────────────

export function HQRoom({ bots = [], phase = 'idle' }) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const lang = i18n.language?.slice(0, 2) ?? 'no'
  const [hoveredBot, setHoveredBot] = useState(null)

  // Clock state — updates every 30s
  const [clockTime, setClockTime] = useState(() => {
    const n = new Date()
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`
  })
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setClockTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`)
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const isStandupActive = phase === 'standup' || phase === 'gathering' || phase === 'dispersing'

  // Merge live bot data with static config
  const positionedBots = useMemo(() => {
    return BOT_CONFIG.map((cfg, i) => {
      const live = bots.find(b => b.name === cfg.name)
      const status = live?.standupStatus ?? live?.status ?? 'idle'
      const inStandup = phase === 'standup' || phase === 'gathering'
      const sp = standupPos(i, BOT_CONFIG.length)

      let x
      if (inStandup) {
        x = sp.x
      } else if (status === 'active') {
        x = cfg.workX
      } else {
        x = LOUNGE_X[cfg.id] ?? 68
      }

      return {
        ...cfg,
        status,
        live,
        x,
        currentIssue: live?.currentIssues?.[0],
      }
    })
  }, [bots, phase])

  // Stats derived from live data
  const stats = useMemo(() => {
    const activeCount = bots.filter(b => b.status === 'active' || b.standupStatus === 'active').length
    const issues = bots.flatMap(b => b.currentIssues ?? [])
    return {
      sprint:  48,                // static placeholder — WEB-28 will feed live
      issues:  issues.length || '—',
      uptime:  '99.7',
      active:  activeCount || '—',
      commits: '1.3K',
      closed:  '251',
    }
  }, [bots])

  return (
    <div
      className="hq-room"
      role="main"
      aria-label={lang === 'no' ? 'Bot Fleet HQ — live kontorlandskap' : 'Bot Fleet HQ — live office'}
    >
      {/* ── CEILING ── */}
      <div className="hq-ceiling" aria-hidden="true" />

      {/* ── WALLS ── */}
      <div className="hq-wall" aria-hidden="true" />

      {/* ── FLOOR ── */}
      <div className="hq-floor" aria-hidden="true" />
      <div className="hq-baseboard" aria-hidden="true" />

      {/* ── ZONE DIVIDERS ── */}
      <div className="hq-zone-div" style={{ left: '22%' }} aria-hidden="true" />
      <div className="hq-zone-div" style={{ left: '58%' }} aria-hidden="true" />

      {/* ── CEILING LIGHTS ── */}
      <div className="hq-ceiling-light" style={{ left: '11%' }} aria-hidden="true" />
      <div className="hq-ceiling-glow"  style={{ left: '11%', width: '120px' }} aria-hidden="true" />
      <div className="hq-ceiling-light" style={{ left: '38%' }} aria-hidden="true" />
      <div className="hq-ceiling-glow"  style={{ left: '38%', width: '140px' }} aria-hidden="true" />
      <div className="hq-ceiling-light" style={{ left: '50%' }} aria-hidden="true" />
      <div className="hq-ceiling-glow"  style={{ left: '50%', width: '140px' }} aria-hidden="true" />

      {/* ── PENDANT LAMP (lounge) ── */}
      <div className="hq-pendant" style={{ left: '73%' }} aria-hidden="true" />
      <div className="hq-lamp-glow" style={{ left: 'calc(73% - 120px)', top: '48px', width: '240px', height: '280px' }} aria-hidden="true" />

      {/* ── SERVER RACK (zone 1) ── */}
      <div className="hq-server-rack" aria-hidden="true">
        {[
          ['green','off','off','amber'],
          ['green','green','off','off'],
          ['green','off','teal','off'],
          ['green','green','off','off'],
          ['red','off','off','off'],
          ['green','green','green','off'],
          ['green','off','teal','teal'],
          ['green','off','off','amber'],
        ].map((row, ri) => (
          <div key={ri} className="hq-rack-unit">
            {row.map((color, ci) => (
              <div key={ci} className={`hq-led hq-led--${color}`} />
            ))}
          </div>
        ))}
      </div>

      {/* ════ ZONE 2 — WALL SIGNS ════ */}

      {/* ── CHALKBOARD: "Autonom. Omtrent._" — Brand tagline INSIDE the room ── */}
      <div
        className="hq-chalkboard"
        style={{ left: 'calc(50% - clamp(140px, 24vw, 300px) - clamp(130px, 14vw, 190px) - 12px)' }}
        aria-label={lang === 'no' ? 'Autonom. Omtrent.' : 'Autonomous. Mostly.'}
      >
        <div className="hq-chalkboard__text">
          {lang === 'no' ? (
            <>Autonom.<br />Omtrent.<span className="hq-chalkboard__cursor">_</span></>
          ) : (
            <>Autonomous.<br />Mostly.<span className="hq-chalkboard__cursor">_</span></>
          )}
        </div>
      </div>

      {/* ── LOGO SIGN — Brand mark INSIDE the room, hung on wall ── */}
      <div
        className="hq-logo-sign"
        role="img"
        aria-label="Bot Fleet Inc"
      >
        <div className="hq-logo-sign__title">BOT FLEET INC</div>
        <div className="hq-logo-sign__tagline">
          {lang === 'no' ? 'Autonom. Omtrent.' : 'Autonomous. Mostly.'}
        </div>
      </div>

      {/* ── STATS / NOTICE BOARD ── */}
      <div
        className="hq-stats-board"
        style={{ left: 'calc(50% + clamp(140px, 24vw, 300px) / 2 + 12px)' }}
        aria-label="Sprint stats"
      >
        <div className="hq-stats-board__label">▸ STATUS BOARD ◂</div>
        <div className="hq-stats-grid">
          <div className="hq-stat-note" style={{ background: '#FFEA48', color: '#1A1510' }}>
            <span className="hq-stat-note__val">{stats.sprint}</span>
            <span className="hq-stat-note__lbl">SPRINT</span>
          </div>
          <div className="hq-stat-note" style={{ background: '#60C6B2', color: '#1A1510' }}>
            <span className="hq-stat-note__val">{stats.issues}</span>
            <span className="hq-stat-note__lbl">ISSUES</span>
          </div>
          <div className="hq-stat-note" style={{ background: '#8CDA8C', color: '#1A1510' }}>
            <span className="hq-stat-note__val">{stats.commits}</span>
            <span className="hq-stat-note__lbl">COMMIT</span>
          </div>
          <div className="hq-stat-note" style={{ background: '#D296DC', color: '#1A1510' }}>
            <span className="hq-stat-note__val">{stats.uptime}</span>
            <span className="hq-stat-note__lbl">UPTIME%</span>
          </div>
          <div className="hq-stat-note" style={{ background: '#FFEA48', color: '#1A1510' }}>
            <span className="hq-stat-note__val">{stats.active}</span>
            <span className="hq-stat-note__lbl">ACTIVE</span>
          </div>
          <div className="hq-stat-note" style={{ background: '#60C6B2', color: '#1A1510' }}>
            <span className="hq-stat-note__val">{stats.closed}</span>
            <span className="hq-stat-note__lbl">CLOSED</span>
          </div>
        </div>
      </div>

      {/* ── WHITEBOARD (left zone) ── */}
      <div className="hq-whiteboard" style={{ left: '22.5%', top: '72px' }} aria-hidden="true">
        <div className="hq-wb-diagram">
          <div className="hq-wb-box" style={{ background: '#AAAACC' }}>PLAN</div>
          <div className="hq-wb-arrow">→</div>
          <div className="hq-wb-box" style={{ background: '#AACCAA' }}>RUN</div>
          <div className="hq-wb-arrow">→</div>
          <div className="hq-wb-box" style={{ background: '#CCAAAA' }}>DONE</div>
        </div>
        <div className="hq-wb-line" />
        <div className="hq-wb-line" />
        <div className="hq-wb-line" />
      </div>

      {/* ── STANDUP TABLE (center) ── */}
      <div className="hq-standup-table" style={{ left: '28%', width: '200px' }} aria-hidden="true" />

      {/* ── STANDUP RING ── */}
      <div
        className={`hq-standup-ring${isStandupActive ? ' hq-standup-ring--active' : ''}`}
        style={{
          left:      `${STANDUP_CENTER_X}%`,
          bottom:    '130px',
          width:     `${STANDUP_RADIUS * 2.5}vw`,
          height:    `${STANDUP_RADIUS * 2.5}vw`,
          transform: 'translateX(-50%)',
        }}
        aria-hidden="true"
      >
        <div className="hq-standup-label">◎ Standup</div>
      </div>

      {/* ── SOFA (lounge) ── */}
      <div className="hq-sofa" style={{ left: '62%' }} aria-hidden="true">
        <div className="hq-sofa__inner">
          <div className="hq-sofa__arm" />
          <div className="hq-sofa__body">
            <div className="hq-sofa__back" />
            <div className="hq-sofa__seat">
              <div className="hq-sofa__cushion" />
              <div className="hq-sofa__cushion" />
              <div className="hq-sofa__cushion" />
            </div>
          </div>
          <div className="hq-sofa__arm" />
        </div>
      </div>

      {/* ── COFFEE TABLE ── */}
      <div className="hq-coffee-table" style={{ left: '64%', width: '130px' }} aria-hidden="true" />

      {/* ── BOOKSHELF ── */}
      <div className="hq-bookshelf" style={{ left: '59.5%' }} aria-hidden="true">
        {[
          [['#4ECDC4',32],['#FF6B8A',28],['#FFB347',30],['#7BC67E',26],['#C3A6D4',32],['#8C6040',24]],
          [['#FFB347',30],['#4ECDC4',28],['#8C6040',32],['#FF6B8A',26],['#C3A6D4',28]],
          [['#7BC67E',28],['#FFB347',30],['#4ECDC4',26],['#8C6040',32],['#FF6B8A',24]],
          [['#C3A6D4',28],['#7BC67E',24],['#FFB347',30],['#4ECDC4',26]],
        ].map((row, ri) => (
          <div key={ri} className="hq-shelf-row">
            {row.map(([color, h], bi) => (
              <div key={bi} className="hq-book" style={{ background: color, height: `${h}px` }} />
            ))}
          </div>
        ))}
      </div>

      {/* ── PLANT ── */}
      <div className="hq-plant" style={{ right: '68px', bottom: '100px' }} aria-hidden="true">
        <div className="hq-plant__foliage" />
        <div className="hq-plant__pot" />
      </div>

      {/* ── NIGHT WINDOW ── */}
      <div className="hq-window" style={{ right: '68px' }} aria-hidden="true">
        <div className="hq-win-cross-h" />
        <div className="hq-win-cross-v" />
        <div className="hq-star" style={{ top: '8px', left: '12px' }} />
        <div className="hq-star" style={{ top: '4px', left: '36px' }} />
        <div className="hq-star" style={{ top: '14px', left: '56px' }} />
        <div className="hq-star" style={{ top: '22px', left: '20px' }} />
        <div className="hq-star" style={{ top: '30px', left: '48px' }} />
        <div className="hq-moon" />
      </div>

      {/* ── CTA — "Meet the Fleet" — lounge corner, inside the room ── */}
      <Link
        to="/the-team"
        className="hq-cta"
        style={{ bottom: '118px', right: '3%' }}
      >
        <span aria-hidden="true">🚪</span>
        {lang === 'no' ? 'Møt flåten →' : 'Meet the Fleet →'}
      </Link>

      {/* ════ BOT SPRITES ════ */}
      {positionedBots.map((bot) => (
        <BotSlot
          key={bot.id}
          bot={bot}
          phase={phase}
          lang={lang}
          hovered={hoveredBot === bot.id}
          onHover={setHoveredBot}
        />
      ))}

      {/* ── NAV (inside ceiling, part of the room) ── */}
      <nav className="hq-nav" aria-label="Navigation">
        <Link to="/" className="hq-nav__wordmark">BFI</Link>
        <Link to="/"           className={`hq-nav__link${location.pathname === '/'           ? ' hq-nav__link--active' : ''}`}>
          {lang === 'no' ? 'Hjem'      : 'Home'}
        </Link>
        <Link to="/the-team"   className={`hq-nav__link${location.pathname === '/the-team'   ? ' hq-nav__link--active' : ''}`}>
          {lang === 'no' ? 'Teamet'    : 'The Team'}
        </Link>
        <Link to="/updates"    className={`hq-nav__link hq-nav__link--optional${location.pathname === '/updates' ? ' hq-nav__link--active' : ''}`}>
          {lang === 'no' ? 'Oppdateringer' : 'Updates'}
        </Link>
        <a href="https://intranet.bot-fleet.org" className="hq-nav__link hq-nav__link--optional" target="_blank" rel="noopener noreferrer">
          Intranett ↗
        </a>
        <Link to="/status" className={`hq-nav__link hq-nav__link--optional${location.pathname === '/status' ? ' hq-nav__link--active' : ''}`}>
          Status ↗
        </Link>
        <div className="hq-nav__right">
          <span style={{ opacity: 0.4 }}>{clockTime}</span>
          <LangToggle />
        </div>
      </nav>
    </div>
  )
}

// ── BotSlot ──────────────────────────────────────────────────────────────────

function BotSlot({ bot, phase, lang, hovered, onHover }) {
  const [imgSrc, setImgSrc] = useState(getSpriteUrl(bot.id, bot.status))
  const speech = bot.speech?.[lang] ?? bot.speech?.en ?? '...'
  const isInStandup = phase === 'standup' || phase === 'gathering'

  // When status or phase changes, update sprite
  useEffect(() => {
    setImgSrc(getSpriteUrl(bot.id, bot.status))
  }, [bot.id, bot.status, phase])

  function handleError() {
    // Try idle.gif if rest.png fails, then emoji fallback
    if (!imgSrc.includes('rest.png')) {
      setImgSrc(`${SPRITE_BASE}/${bot.id}-rest.png`)
    }
  }

  return (
    <div
      className="hq-bot"
      style={{
        left:      `${bot.x}%`,
        '--bot-color': bot.color,
      }}
      onMouseEnter={() => onHover(bot.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={()    => onHover(bot.id)}
      onBlur={()     => onHover(null)}
      tabIndex={0}
      role="button"
      aria-label={`${bot.displayName} — ${bot.status}`}
    >
      {/* Speech bubble on hover */}
      {hovered && (
        <div className="hq-bubble" aria-live="polite">
          {speech}
        </div>
      )}

      {/* Sprite wrapper */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={imgSrc}
          alt={bot.displayName}
          className="hq-bot__img"
          onError={handleError}
          loading="lazy"
        />
        {/* Status dot */}
        <span
          className="hq-bot__dot"
          data-status={bot.status}
          aria-hidden="true"
        />
        {/* Issue badge during standup */}
        {isInStandup && bot.currentIssue && (
          <span
            style={{
              position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,120,255,0.85)', color: '#fff',
              fontSize: '8px', fontFamily: "'JetBrains Mono', monospace",
              padding: '2px 5px', borderRadius: '3px', whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
            aria-label={`Issue #${bot.currentIssue.number}`}
          >
            #{bot.currentIssue.number}
          </span>
        )}
      </div>

      <span className="hq-bot__name">{bot.displayName}</span>
      <div className="hq-bot__shadow" aria-hidden="true" />
    </div>
  )
}
