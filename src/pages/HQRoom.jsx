/**
 * HQRoom — Bot Fleet Inc Homepage
 * Full-page 2D office landscape (WEB-10)
 *
 * Design: design-bot WEB-HQ-prototype.html + bfi-hq-v3-preview.png
 * Constraint: Logo sign + chalkboard tagline live INSIDE the room,
 *             not as external UI elements.
 *
 * Acceptance criteria (WEB-10):
 *  ✓ Entire viewport IS the room (no traditional hero section)
 *  ✓ Logo sign + chalkboard + stats board + desks + standup circle + lounge
 *  ✓ All bots shown with correct sprites from R2
 *  ✓ Bots reposition based on live GitHub status
 *  ✓ Hover → speech bubble with bot personality
 *  ✓ "Meet the Fleet" CTA in lounge corner
 *  ✓ Mobile responsive (scales down at <768px)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFleet, STATIC_FLEET } from '../hooks/useFleet.js';
import { FleetLogoWallpaper } from '../components/FleetLogoWallpaper.jsx';
import WallKanban from '../components/WallKanban.jsx';
import './HQRoom.css';

// ── R2 sprite base ───────────────────────────────────────────────
const SPRITE_BASE = 'https://pub-9d8a85e5e17847949d36335948eeaee0.r2.dev/sprites';

function spriteRest(key) {
  return `${SPRITE_BASE}/${key}-rest.png`;
}
function spriteIdle(key) {
  return `${SPRITE_BASE}/${key}-idle.gif`;
}

// ── Zone position maps ────────────────────────────────────────────
// Each bot has a primary zone and fallback positions per live status.
const ZONE_POSITIONS = {
  dispatch: {
    workstation: { left: '26%' },
    standup:     { left: '31%' },
    lounge:      { left: '68%', bottom: '175px' },
  },
  design: {
    workstation: { left: '65%', bottom: '175px' },
    standup:     { left: '36%' },
    lounge:      { left: '65%', bottom: '175px' },
  },
  coding: {
    workstation: { left: '43%' },
    standup:     { left: '40%' },
    lounge:      { left: '72%', bottom: '175px' },
  },
  audit: {
    // Audit is "planned" — defaults to lounge/observer position
    workstation: { left: '78%', bottom: '175px' },
    standup:     { left: '42%' },
    lounge:      { left: '78%', bottom: '175px' },
  },
};

/** Derive which visual zone a bot should be in based on live status */
function deriveZone(botStatus, defaultZone) {
  // Offline bots go to workstation (idle at desk)
  if (!botStatus || botStatus === 'offline') return 'workstation';
  // Planned bots default to their configured zone (e.g. audit → lounge/observer)
  if (botStatus === 'planned') return defaultZone || 'lounge';
  if (botStatus === 'active' || botStatus === 'loading') return defaultZone || 'workstation';
  return defaultZone || 'workstation';
}

// ── Bot definitions ──────────────────────────────────────────────
const BOTS = [
  {
    id: 'dispatch',
    apiName: 'dispatch-bot',
    key: 'dispatch',
    displayName: 'Dispatch',
    color: '#4ECDC4',
    defaultZone: 'standup',
    bubbles: [
      '> 3 issues assigned. On it.',
      '> Fleet status: MOSTLY OK.',
      '> New PR from coding-bot. Reviewing.',
    ],
    link: '/bots/dispatch-bot',
  },
  {
    id: 'design',
    apiName: 'design-bot',
    key: 'design',
    displayName: 'Design',
    color: '#FF6B8A',
    defaultZone: 'lounge',
    bubbles: [
      '> That font kerning is wrong.',
      '> Approved. (grudgingly)',
      '> The beret is not optional.',
    ],
    link: '/bots/design-bot',
  },
  {
    id: 'coding',
    apiName: 'coding-bot',
    key: 'coding',
    displayName: 'Coding',
    color: '#FFB347',
    defaultZone: 'workstation',
    bubbles: [
      "> git commit -m 'fix: actually fix it'",
      '> undefined is not a function. again.',
      "> deploying. don't touch anything.",
    ],
    link: '/bots/coding-bot',
  },
  {
    id: 'audit',
    apiName: 'audit-bot',
    key: 'audit',
    displayName: 'Audit',
    color: '#5CBA8C',
    defaultZone: 'lounge',
    bubbles: [
      '> DoD not met. revise.',
      '> where is the test coverage.',
      '> lgtm. (barely)',
    ],
    link: '/bots/audit-bot',
  },
];

// ── Server rack LEDs ─────────────────────────────────────────────
const RACK_UNITS = [
  ['#7BC67E', '#333', '#333', '#FFB347'],
  ['#7BC67E', '#7BC67E', '#333', '#333'],
  ['#7BC67E', '#333', '#4ECDC4', '#333'],
  ['#7BC67E', '#7BC67E', '#333', '#333'],
  ['#FF6B8A', '#333', '#333', '#333'],
  ['#7BC67E', '#7BC67E', '#7BC67E', '#333'],
  ['#7BC67E', '#333', '#4ECDC4', '#4ECDC4'],
  ['#7BC67E', '#333', '#333', '#FFB347'],
];

// ── Bot sprite + speech bubble ───────────────────────────────────
function BotSlot({ bot, status }) {
  const [hovered, setHovered] = useState(false);
  const [bubbleIdx, setBubbleIdx] = useState(0);
  const imgRef = useRef(null);
  const navigate = useNavigate();

  const isOnline = status && status !== 'offline' && status !== 'planned';
  const zone = deriveZone(status, bot.defaultZone);
  const posStyle = ZONE_POSITIONS[bot.key]?.[zone] || ZONE_POSITIONS[bot.key]?.workstation || {};

  const handleEnter = useCallback(() => {
    setHovered(true);
    setBubbleIdx(Math.floor(Math.random() * bot.bubbles.length));
    if (imgRef.current) imgRef.current.src = spriteIdle(bot.key);
  }, [bot]);

  const handleLeave = useCallback(() => {
    setHovered(false);
    setTimeout(() => {
      if (imgRef.current) imgRef.current.src = spriteRest(bot.key);
    }, 800);
  }, [bot]);

  const handleClick = useCallback(() => {
    navigate(bot.link);
  }, [bot.link, navigate]);

  return (
    <div
      className={`hq-bot-slot${hovered ? ' hq-bot-slot--hovered' : ''}${zone === 'lounge' ? ' hq-bot-slot--lounge' : ''}`}
      style={{ '--bot-color': bot.color, ...posStyle }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${bot.displayName} bot — click to view profile`}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {hovered && (
        <div className="hq-bubble" aria-live="polite">
          {bot.bubbles[bubbleIdx]}
        </div>
      )}
      <img
        ref={imgRef}
        src={spriteRest(bot.key)}
        alt={`${bot.displayName} bot`}
        className="hq-bot-sprite pixel-art"
        loading="lazy"
        onError={(e) => {
          // Sprite not yet on R2 — show coloured placeholder
          e.target.style.display = 'none';
          if (e.target.nextSibling?.classList?.contains('hq-bot-placeholder')) return;
          const ph = document.createElement('div');
          ph.className = 'hq-bot-placeholder';
          ph.style.background = bot.color;
          e.target.parentNode.insertBefore(ph, e.target.nextSibling);
        }}
      />
      <span className="hq-bot-name">{bot.displayName}</span>
      <div
        className="hq-bot-status"
        aria-hidden="true"
        style={{ background: isOnline ? '#7BC67E' : '#484F58' }}
        title={isOnline ? 'online' : 'offline'}
      />
      <div className="hq-bot-reflection" aria-hidden="true" />
    </div>
  );
}

// ── Stats from /api/bots (or GitHub fallback) ────────────────────
// ── Stats — notice board data from /api/stats (WEB-9) ───────────
const FALLBACK_STATS = {
  sprints:  3,
  projects: 8,
  issues:   120,
  bots:     4,
  commits:  142,
  uptime:   '99.7',
};

function fmt(n) {
  if (typeof n !== 'number') return String(n);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function useStats() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.stats) setStats({ ...FALLBACK_STATS, ...data.stats });
      })
      .catch(() => { /* use fallback */ });
  }, []);
  return stats;
}

// ── Chalkboard — tagline lives on the WALL ───────────────────────
function Chalkboard() {
  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hq-chalkboard" aria-label="Chalkboard: Autonom. Omtrent.">
      <div className="hq-chalkboard__header">// tagline</div>
      <div className="hq-chalkboard__main">
        Autonom. Omtrent.
        <span className="hq-chalkboard__cursor" aria-hidden="true">
          {cursor ? '_' : '\u00A0'}
        </span>
      </div>
      <div className="hq-chalkboard__sub">&gt; 5 bots. ~0 incidents.</div>
      <div className="hq-chalkboard__lines" aria-hidden="true">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ── Logo sign — INSIDE the room on the back wall ─────────────────
function LogoSign() {
  return (
    <div className="hq-logo-sign" aria-label="Bot Fleet Inc">
      <div className="hq-logo-sign__title">BOT FLEET INC</div>
      <div className="hq-logo-sign__sub">EST. 2025</div>
    </div>
  );
}

// ── Notice board ─────────────────────────────────────────────────
// Stats fetched from /api/stats (WEB-9) — KV cached 30 min, static fallback
function NoticeBoard({ stats }) {
  return (
    <div className="hq-notice-board" aria-label="Status board — live GitHub stats">
      <div className="hq-notice-board__label">▸ STATUS BOARD ◂</div>
      <div className="hq-notice-board__grid">
        <div className="hq-stat-note hq-stat-note--yellow">
          <span className="hq-stat-val">🏃 {fmt(stats.sprints)}</span>
          <span className="hq-stat-lbl">SPRINTS</span>
        </div>
        <div className="hq-stat-note hq-stat-note--teal">
          <span className="hq-stat-val">📦 {fmt(stats.projects)}</span>
          <span className="hq-stat-lbl">PROJECTS</span>
        </div>
        <div className="hq-stat-note hq-stat-note--green">
          <span className="hq-stat-val">✅ {fmt(stats.issues)}</span>
          <span className="hq-stat-lbl">CLOSED</span>
        </div>
        <div className="hq-stat-note hq-stat-note--purple">
          <span className="hq-stat-val">🤖 {fmt(stats.bots)}</span>
          <span className="hq-stat-lbl">BOTS</span>
        </div>
        <div className="hq-stat-note hq-stat-note--yellow">
          <span className="hq-stat-val">💬 {fmt(stats.commits)}</span>
          <span className="hq-stat-lbl">COMMITS</span>
        </div>
        <div className="hq-stat-note hq-stat-note--teal">
          <span className="hq-stat-val">⚡ {stats.uptime}%</span>
          <span className="hq-stat-lbl">UPTIME</span>
        </div>
      </div>
    </div>
  );
}

// ── Standup circle — pulsing ring on the floor ───────────────────
function StandupCircle() {
  return (
    <div className="hq-standup-circle" aria-label="Standup circle" aria-hidden="true">
      <div className="hq-standup-ring hq-standup-ring--outer" />
      <div className="hq-standup-ring hq-standup-ring--inner" />
      <div className="hq-standup-dot" style={{ left: '15%', top: '35%' }} />
      <div className="hq-standup-dot" style={{ left: '35%', top: '10%' }} />
      <div className="hq-standup-dot" style={{ left: '65%', top: '10%' }} />
      <div className="hq-standup-dot" style={{ left: '85%', top: '35%' }} />
      <div className="hq-standup-dot" style={{ left: '50%', top: '65%' }} />
    </div>
  );
}

// ── Main HQRoom component ────────────────────────────────────────
export function HQRoom() {
  const { bots, loading } = useFleet();
  const displayBots = loading ? STATIC_FLEET : bots;
  const stats = useStats();

  // Build a quick status lookup: botApiName → status
  const statusByName = Object.fromEntries(
    displayBots.map((b) => [b.name, b.status])
  );

  return (
    <div className="hq-scene" role="main" aria-label="Bot Fleet Inc Headquarters">

      {/* ── CEILING ── */}
      <div className="hq-ceiling" aria-hidden="true" />

      {/* ── WALL ── */}
      <div className="hq-wall" aria-hidden="true" />

      {/* ── ZONE DIVIDERS ── */}
      <div className="hq-zone-div" style={{ left: '22%' }} aria-hidden="true" />
      <div className="hq-zone-div" style={{ left: '58%' }} aria-hidden="true" />

      {/* ── CEILING LIGHTS ── */}
      <div className="hq-ceiling-light" style={{ left: '11%' }} aria-hidden="true" />
      <div className="hq-ceiling-glow"  style={{ left: '11%', width: '120px' }} aria-hidden="true" />
      <div className="hq-ceiling-light" style={{ left: '38%' }} aria-hidden="true" />
      <div className="hq-ceiling-glow"  style={{ left: '38%', width: '140px' }} aria-hidden="true" />
      <div className="hq-ceiling-light" style={{ left: '62%' }} aria-hidden="true" />
      <div className="hq-ceiling-glow"  style={{ left: '62%', width: '140px' }} aria-hidden="true" />

      {/* ── PENDANT LAMP (lounge) ── */}
      <div className="hq-pendant" style={{ left: '73%' }} aria-hidden="true" />
      <div
        className="hq-lamp-glow"
        style={{ left: 'calc(73% - 120px)', top: '48px', width: '240px', height: '280px' }}
        aria-hidden="true"
      />

      {/* ═══ ZONE 1 — SERVER ROOM ═══ */}
      <div className="hq-server-rack" aria-label="Server rack" role="img">
        {RACK_UNITS.map((unit, i) => (
          <div key={i} className="hq-rack-unit">
            {unit.map((color, j) => (
              <div key={j} className="hq-led" style={{ background: color }} />
            ))}
          </div>
        ))}
      </div>

      {/* Night window — left (server room) */}
      <div className="hq-window hq-window--left" aria-label="Window — night sky" role="img">
        <div className="hq-win-cross-h" />
        <div className="hq-win-cross-v" />
        <div className="hq-star" style={{ top: '8px',  left: '12px' }} />
        <div className="hq-star" style={{ top: '4px',  left: '36px' }} />
        <div className="hq-star" style={{ top: '14px', left: '56px' }} />
        <div className="hq-star" style={{ top: '22px', left: '20px' }} />
        <div className="hq-star" style={{ top: '30px', left: '48px' }} />
        <div className="hq-moon" />
      </div>

      {/* ═══ ZONE 2 — STANDUP / MAIN AREA ═══ */}

      {/* ▶ LOGO SIGN — branding INSIDE the room on the back wall */}
      <LogoSign />

      {/* ▶ FLEET LOGO WALLPAPER — interactive >_ pixel art poster (WEB-14) */}
      <FleetLogoWallpaper className="hq-fleet-logo" />

      {/* ▶ CHALKBOARD — "Autonom. Omtrent._" on the wall, not external UI */}
      <Chalkboard />

      {/* Whiteboard — live Kanban board (WEB-11) */}
      <div className="hq-whiteboard" aria-label="Project board">
        <WallKanban />
      </div>

      {/* Standup table */}
      <div className="hq-standup-table" aria-hidden="true" />

      {/* Standup circle — pulsing ring on the floor */}
      <StandupCircle />

      {/* Notice board (stats) */}
      <NoticeBoard stats={stats} />

      {/* Ledige stillinger — wall notice (WEB-17) */}
      <div className="hq-ledige-stillinger" aria-label="Ledige stillinger">
        <div className="hq-ledige__pin" aria-hidden="true" />
        <div className="hq-ledige__header">📋 Ledige stillinger</div>
        <div className="hq-ledige__item">
          <span className="hq-ledige__emoji">🔧</span>
          <span className="hq-ledige__text">
            <strong>devops-bot</strong><br />
            Infrastruktur-eier<br />
            <em>(Proxmox · CF · UniFi)</em>
          </span>
        </div>
        <div className="hq-ledige__item">
          <span className="hq-ledige__emoji">🏛️</span>
          <span className="hq-ledige__text">
            <strong>archi-bot</strong><br />
            Enterprise-arkitekt
          </span>
        </div>
        <div className="hq-ledige__item">
          <span className="hq-ledige__emoji">💼</span>
          <span className="hq-ledige__text">
            <strong>crm-bot</strong><br />
            Kundeansvarlig
          </span>
        </div>
      </div>

      {/* ═══ ZONE 3 — LOUNGE ═══ */}

      {/* Bookshelf */}
      <div className="hq-bookshelf" aria-hidden="true">
        {[
          ['#4ECDC4', '#FF6B8A', '#FFB347', '#7BC67E', '#C3A6D4', '#90A4AE'],
          ['#4ECDC4', '#FF6B8A', '#FFB347', '#7BC67E', '#C3A6D4'],
          ['#FF6B8A', '#FFB347', '#4ECDC4', '#90A4AE', '#7BC67E'],
          ['#C3A6D4', '#4ECDC4', '#FF6B8A', '#FFB347'],
        ].map((row, i) => (
          <div key={i} className="hq-shelf-row" style={i === 3 ? { borderBottom: 'none' } : {}}>
            {row.map((c, j) => (
              <div key={j} className="hq-book" style={{ background: c }} />
            ))}
          </div>
        ))}
      </div>

      {/* Sofa */}
      <div className="hq-sofa" aria-hidden="true">
        <div className="hq-sofa-arm" />
        <div className="hq-sofa-body">
          <div className="hq-sofa-back" />
          <div className="hq-sofa-seat">
            <div className="hq-sofa-cushion" />
            <div className="hq-sofa-cushion" />
            <div className="hq-sofa-cushion" />
          </div>
        </div>
        <div className="hq-sofa-arm" />
      </div>

      {/* Coffee table */}
      <div className="hq-coffee-table" aria-hidden="true" />

      {/* Coffee machine */}
      <div className="hq-coffee-machine" aria-hidden="true">
        <div className="hq-cm-screen">☕ OK</div>
        <div className="hq-cm-buttons">
          <div className="hq-cm-btn" />
          <div className="hq-cm-btn" />
          <div className="hq-cm-btn" />
        </div>
      </div>

      {/* Plant */}
      <div className="hq-plant" aria-hidden="true">
        <div className="hq-foliage" />
        <div className="hq-pot" />
      </div>

      {/* Night window — right (lounge) */}
      <div className="hq-window hq-window--right" aria-label="Window — night sky" role="img">
        <div className="hq-win-cross-h" />
        <div className="hq-win-cross-v" />
        <div className="hq-star" style={{ top: '6px',  left: '10px' }} />
        <div className="hq-star" style={{ top: '18px', left: '52px' }} />
        <div className="hq-star" style={{ top: '28px', left: '30px' }} />
        <div className="hq-moon" style={{ top: '4px', right: '6px' }} />
      </div>

      {/* ▶ "Meet the Fleet" CTA — lounge corner of the room */}
      <div className="hq-lounge-cta" aria-label="Lounge: meet the fleet">
        <div className="hq-lounge-cta__sign">LOUNGE</div>
        <Link to="/the-team" className="hq-lounge-cta__btn">
          &gt; Meet the Fleet ↓
        </Link>
        <a
          href="https://github.com/Bot-Fleet-Inc"
          className="hq-lounge-cta__sticky"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Fleet ops on GitHub"
        >
          fleet-ops ↗
        </a>
      </div>

      {/* ═══ FLOOR ═══ */}
      <div className="hq-floor" aria-hidden="true" />
      <div className="hq-baseboard" aria-hidden="true" />

      {/* ═══ BOTS — positions driven by live GitHub status ═══ */}
      {BOTS.map((bot) => (
        <BotSlot
          key={bot.id}
          bot={bot}
          status={statusByName[bot.apiName]}
        />
      ))}

      {/* ═══ EMBEDDED NAV (replaces global Navbar on homepage) ═══ */}
      <nav className="hq-nav" aria-label="Main navigation">
        <span className="hq-nav__logo" aria-hidden="true">BFI</span>
        <div className="hq-nav__links">
          <Link to="/"          className="hq-nav__link hq-nav__link--active">Hjem</Link>
          <Link to="/the-team"  className="hq-nav__link">Teamet</Link>
          <Link to="/updates"   className="hq-nav__link">Oppdateringer</Link>
          <a
            href="https://intranet.bot-fleet.org"
            className="hq-nav__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Intranett ↗
          </a>
          <Link to="/status" className="hq-nav__link">Status ↗</Link>
        </div>
        <div className="hq-nav__right">EN</div>
      </nav>

    </div>
  );
}
