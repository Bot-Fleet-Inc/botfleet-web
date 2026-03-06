/**
 * HQRoom — Bot Fleet Inc Homepage
 * Full-page 2D office landscape (WEB-10)
 *
 * Design: design-bot WEB-HQ-prototype.html + bfi-hq-v3-preview.png
 * Constraint: Logo sign + chalkboard tagline live INSIDE the room,
 *             not as external UI elements.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFleet, STATIC_FLEET } from '../hooks/useFleet.js';
import './HQRoom.css';

// ── Sprite base ──────────────────────────────────────────────────
const SPRITE_BASE = 'https://pub-9d8a85e5e17847949d36335948eeaee0.r2.dev/sprites';

function spriteRest(name) {
  return `${SPRITE_BASE}/${name}-rest.png`;
}
function spriteIdle(name) {
  return `${SPRITE_BASE}/${name}-idle.gif`;
}

// ── Bot definitions ──────────────────────────────────────────────
const BOTS = [
  {
    id: 'dispatch-bot',
    key: 'dispatch',
    displayName: 'Dispatch',
    color: '#4ECDC4',
    zone: 'standup',
    style: { left: '26%' },
    bubbles: [
      '> 3 issues assigned. On it.',
      '> Fleet status: MOSTLY OK.',
      '> New PR from coding-bot. Reviewing.',
    ],
    link: '/bots/dispatch-bot',
  },
  {
    id: 'design-bot',
    key: 'design',
    displayName: 'Design',
    color: '#FF6B8A',
    zone: 'lounge',
    style: { left: '65%', bottom: '175px' },
    bubbles: [
      '> That font kerning is wrong.',
      '> Approved. (grudgingly)',
      '> The beret is not optional.',
    ],
    link: '/bots/design-bot',
  },
  {
    id: 'coding-bot',
    key: 'coding',
    displayName: 'Coding',
    color: '#FFB347',
    zone: 'standup',
    style: { left: '43%' },
    bubbles: [
      "> git commit -m 'fix: actually fix it'",
      '> undefined is not a function. again.',
      '> deploying. don\'t touch anything.',
    ],
    link: '/bots/coding-bot',
  },
  {
    id: 'archi-bot',
    key: 'archi',
    displayName: 'Archi',
    color: '#7BC67E',
    zone: 'standup',
    style: { left: '34%' },
    bubbles: [
      '> The diagram was correct.',
      '> This is load-bearing whitespace.',
      '> Per the spec...',
    ],
    link: '/bots/archi-bot',
  },
  {
    id: 'infra-bot',
    key: 'infra',
    displayName: 'Infra',
    color: '#C3A6D4',
    zone: 'server',
    style: { left: '9%' },
    bubbles: [
      '> uptime: 99.2%. close enough.',
      '> the lights are blinking. that\'s fine.',
      '> have you tried turning it off.',
    ],
    link: '/bots/infra-bot',
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
function BotSlot({ bot, fleetStatus }) {
  const [hovered, setHovered] = useState(false);
  const [bubbleIdx, setBubbleIdx] = useState(0);
  const imgRef = useRef(null);
  const navigate = useNavigate();

  const isOnline = fleetStatus[bot.id] !== 'offline' && fleetStatus[bot.id] !== undefined;

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
      className={`hq-bot-slot${hovered ? ' hq-bot-slot--hovered' : ''}`}
      style={{ '--bot-color': bot.color, ...bot.style }}
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
      />
      <span className="hq-bot-name">{bot.displayName}</span>
      <div
        className="hq-bot-status"
        aria-hidden="true"
        style={{ background: isOnline ? '#7BC67E' : '#484F58' }}
        title={isOnline ? 'online' : 'offline'}
      />
    </div>
  );
}

// ── Stats from /api/bots (or GitHub fallback) ────────────────────
const FALLBACK_STATS = {
  sprint: '3',
  issues: '12',
  commits: '1.4K',
  uptime: '99.7',
  deploys: '88',
  closed: '247',
};

function useStats() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  useEffect(() => {
    fetch('/api/bots')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        // Worker returns { bots: [...], stats?: {...} }
        if (data.stats) setStats(data.stats);
      })
      .catch(() => { /* use fallback */ });
  }, []);
  return stats;
}

// ── Chalkboard blinking cursor ───────────────────────────────────
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

// ── Logo sign ────────────────────────────────────────────────────
function LogoSign() {
  return (
    <div className="hq-logo-sign" aria-label="Bot Fleet Inc">
      <div className="hq-logo-sign__title">BOT FLEET INC</div>
      <div className="hq-logo-sign__sub">EST. 2025</div>
    </div>
  );
}

// ── Notice board ─────────────────────────────────────────────────
function NoticeBoard({ stats }) {
  return (
    <div className="hq-notice-board" aria-label="Status board">
      <div className="hq-notice-board__label">▸ STATUS BOARD ◂</div>
      <div className="hq-notice-board__grid">
        <div className="hq-stat-note hq-stat-note--yellow">
          <span className="hq-stat-val">{stats.sprint}</span>
          <span className="hq-stat-lbl">SPRINT</span>
        </div>
        <div className="hq-stat-note hq-stat-note--teal">
          <span className="hq-stat-val">{stats.issues}</span>
          <span className="hq-stat-lbl">ISSUES</span>
        </div>
        <div className="hq-stat-note hq-stat-note--green">
          <span className="hq-stat-val">{stats.commits}</span>
          <span className="hq-stat-lbl">COMMITS</span>
        </div>
        <div className="hq-stat-note hq-stat-note--purple">
          <span className="hq-stat-val">{stats.uptime}</span>
          <span className="hq-stat-lbl">UPTIME%</span>
        </div>
        <div className="hq-stat-note hq-stat-note--yellow">
          <span className="hq-stat-val">{stats.deploys}</span>
          <span className="hq-stat-lbl">DEPLOY</span>
        </div>
        <div className="hq-stat-note hq-stat-note--teal">
          <span className="hq-stat-val">{stats.closed}</span>
          <span className="hq-stat-lbl">CLOSED</span>
        </div>
      </div>
    </div>
  );
}

// ── Main HQRoom component ────────────────────────────────────────
export function HQRoom() {
  const { bots, loading } = useFleet();
  const displayBots = loading ? STATIC_FLEET : bots;
  const stats = useStats();

  // Build a quick status lookup: botName → status
  const fleetStatus = Object.fromEntries(
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
      <div className="hq-lamp-glow" style={{ left: 'calc(73% - 120px)', top: '48px', width: '240px', height: '280px' }} aria-hidden="true" />

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

      {/* Night window (left side, near server room) */}
      <div className="hq-window hq-window--left" aria-label="Window — night sky" role="img">
        <div className="hq-win-cross-h" />
        <div className="hq-win-cross-v" />
        <div className="hq-star" style={{ top: '8px', left: '12px' }} />
        <div className="hq-star" style={{ top: '4px', left: '36px' }} />
        <div className="hq-star" style={{ top: '14px', left: '56px' }} />
        <div className="hq-star" style={{ top: '22px', left: '20px' }} />
        <div className="hq-star" style={{ top: '30px', left: '48px' }} />
        <div className="hq-moon" />
      </div>

      {/* ═══ ZONE 2 — STANDUP / MAIN AREA ═══ */}

      {/* Logo sign — CENTER WALL (branding INSIDE room, not external) */}
      <LogoSign />

      {/* Chalkboard — "Autonom. Omtrent._" lives on the wall, not external UI */}
      <Chalkboard />

      {/* Whiteboard (mini) */}
      <div className="hq-whiteboard" aria-label="Whiteboard">
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

      {/* Standup table */}
      <div className="hq-standup-table" aria-hidden="true" />

      {/* Standup circle on floor */}
      <div className="hq-standup-circle" aria-label="Standup circle" aria-hidden="true">
        <div className="hq-standup-ring" />
        <div className="hq-standup-dot" style={{ left: '20%', top: '30%' }} />
        <div className="hq-standup-dot" style={{ left: '40%', top: '10%' }} />
        <div className="hq-standup-dot" style={{ left: '60%', top: '10%' }} />
        <div className="hq-standup-dot" style={{ left: '80%', top: '30%' }} />
        <div className="hq-standup-dot" style={{ left: '50%', top: '60%' }} />
      </div>

      {/* Notice board */}
      <NoticeBoard stats={stats} />

      {/* ═══ ZONE 3 — LOUNGE ═══ */}

      {/* Bookshelf */}
      <div className="hq-bookshelf" aria-hidden="true">
        {[
          ['#4ECDC4', '#FF6B8A', '#FFB347', '#7BC67E', '#C3A6D4', '#8C6040'],
          ['#FFB347', '#4ECDC4', '#8C6040', '#FF6B8A', '#C3A6D4'],
          ['#7BC67E', '#FFB347', '#4ECDC4', '#8C6040', '#FF6B8A'],
          ['#C3A6D4', '#7BC67E', '#FFB347', '#4ECDC4'],
        ].map((row, i) => (
          <div key={i} className="hq-shelf-row">
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

      {/* Night window (right side, lounge) */}
      <div className="hq-window hq-window--right" aria-label="Window — night sky" role="img">
        <div className="hq-win-cross-h" />
        <div className="hq-win-cross-v" />
        <div className="hq-star" style={{ top: '6px', left: '10px' }} />
        <div className="hq-star" style={{ top: '18px', left: '52px' }} />
        <div className="hq-star" style={{ top: '28px', left: '30px' }} />
        <div className="hq-moon" style={{ top: '4px', right: '6px' }} />
      </div>

      {/* "Meet the Fleet" CTA — lives in the lounge corner of the room */}
      <div className="hq-lounge-cta" aria-label="Lounge: call to action">
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

      {/* ═══ BOTS ═══ */}
      {BOTS.map((bot) => (
        <BotSlot key={bot.id} bot={bot} fleetStatus={fleetStatus} />
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
          <Link to="/status"    className="hq-nav__link">Status ↗</Link>
        </div>
        <div className="hq-nav__right">EN</div>
      </nav>

    </div>
  );
}
