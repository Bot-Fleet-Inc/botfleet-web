/**
 * WallKanban — Adaptive project board for HQ room wall
 * WEB-11: Shows live GitHub Epics in compact or full Kanban mode.
 *
 * Compact mode (≤1200px wide OR ≤700px tall): single "hottest" epic card
 * Full mode: four columns — Planned | In Progress | Blocked | Done
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import './WallKanban.css';

// Bot signature colors
const BOT_COLORS = {
  'botfleet-dispatch': '#4ECDC4',
  'dispatch-bot':      '#4ECDC4',
  'botfleet-design':   '#FF6B8A',
  'design-bot':        '#FF6B8A',
  'botfleet-coding':   '#FFB347',
  'coding-bot':        '#FFB347',
  'botfleet-archi':    '#7BC67E',
  'archi-bot':         '#7BC67E',
  'botfleet-infra':    '#C3A6D4',
  'infra-bot':         '#C3A6D4',
  'botfleet-audit':    '#F7D794',
  'audit-bot':         '#F7D794',
};

const BOT_DISPLAY_NAMES = {
  'botfleet-dispatch': 'dispatch-bot',
  'dispatch-bot':      'dispatch-bot',
  'botfleet-design':   'design-bot',
  'design-bot':        'design-bot',
  'botfleet-coding':   'coding-bot',
  'coding-bot':        'coding-bot',
  'botfleet-archi':    'archi-bot',
  'archi-bot':         'archi-bot',
  'botfleet-infra':    'infra-bot',
  'infra-bot':         'infra-bot',
  'botfleet-audit':    'audit-bot',
  'audit-bot':         'audit-bot',
};

const COLUMNS = ['Planned', 'In Progress', 'Blocked', 'Done'];
const COMPACT_WIDTH  = 1200;
const COMPACT_HEIGHT = 700;
const DONE_MAX = 4;

/** Sort epics: blocked first, then by updatedAt desc */
function sortEpics(epics) {
  return [...epics].sort((a, b) => {
    const aBlocked = a.status === 'Blocked' ? 0 : 1;
    const bBlocked = b.status === 'Blocked' ? 0 : 1;
    if (aBlocked !== bBlocked) return aBlocked - bBlocked;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

/** Pick the "hottest" epic: most recently active, blocked surfaced */
function hottestEpic(epics) {
  if (!epics.length) return null;
  // Blocked first, then most recently updated
  const blocked = epics.filter((e) => e.status === 'Blocked');
  if (blocked.length) {
    return blocked.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
  }
  return [...epics].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
}

/** Get bot color from assignees list */
function getBotColor(assignees) {
  if (!assignees?.length) return '#888';
  for (const login of assignees) {
    const color = BOT_COLORS[login];
    if (color) return color;
  }
  return '#888';
}

/** Get bot display name from assignees */
function getBotName(assignees) {
  if (!assignees?.length) return null;
  for (const login of assignees) {
    const name = BOT_DISPLAY_NAMES[login];
    if (name) return name;
  }
  return assignees[0];
}

/** Format relative time */
function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EpicCard({ epic, compact = false }) {
  const color = getBotColor(epic.assignees);
  const botName = getBotName(epic.assignees);
  const tooltip = [botName, epic.status].filter(Boolean).join(' · ');

  function handleClick() {
    if (epic.url) window.open(epic.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      className={`wk-card ${compact ? 'wk-card--compact' : ''} ${epic.status === 'Blocked' ? 'wk-card--blocked' : ''}`}
      style={{ '--bot-color': color }}
      onClick={handleClick}
      title={tooltip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`${epic.title} — ${epic.status}`}
    >
      <div className="wk-card-accent" />
      <div className="wk-card-body">
        <span className="wk-card-title">{epic.title}</span>
        {compact && (
          <span className="wk-card-status-badge">{epic.status}</span>
        )}
        <span className="wk-card-meta">{relativeTime(epic.updatedAt)}</span>
      </div>
      <div className="wk-card-tooltip">
        {botName && <span className="wk-tooltip-bot">{botName}</span>}
        <span className="wk-tooltip-status">{epic.status}</span>
      </div>
    </div>
  );
}

function KanbanColumn({ title, epics, maxCards }) {
  const displayed = maxCards ? epics.slice(0, maxCards) : epics;

  return (
    <div className="wk-column">
      <div className="wk-column-header">
        <span className="wk-column-title">{title}</span>
        <span className="wk-column-count">{epics.length}</span>
      </div>
      <div className="wk-column-cards">
        {displayed.length === 0 ? (
          <div className="wk-empty">No active epics</div>
        ) : (
          displayed.map((epic) => (
            <EpicCard key={epic.id || epic.number} epic={epic} />
          ))
        )}
        {maxCards && epics.length > maxCards && (
          <div className="wk-overflow">+{epics.length - maxCards} more</div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WallKanban() {
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompact, setIsCompact] = useState(
    window.innerWidth <= COMPACT_WIDTH || window.innerHeight <= COMPACT_HEIGHT
  );
  const containerRef = useRef(null);

  // Fetch epics on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/epics?board=true');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setEpics(json.epics ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Resize listener → compact/full switch
  const checkSize = useCallback(() => {
    setIsCompact(window.innerWidth <= COMPACT_WIDTH || window.innerHeight <= COMPACT_HEIGHT);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [checkSize]);

  // Group epics by status
  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col] = sortEpics(epics.filter((e) => e.status === col));
    return acc;
  }, {});

  const allSorted = sortEpics(epics);
  const hottest = hottestEpic(allSorted);

  if (loading) {
    return (
      <div className="wk-root wk-loading" ref={containerRef}>
        <div className="wk-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="wk-root wk-error" ref={containerRef}>
        <span className="wk-error-text">Board unavailable</span>
      </div>
    );
  }

  if (isCompact) {
    // Compact: single hottest card
    return (
      <div className="wk-root wk-compact" ref={containerRef}>
        <div className="wk-compact-label">EPICS</div>
        {hottest ? (
          <EpicCard epic={hottest} compact />
        ) : (
          <div className="wk-empty">No active epics</div>
        )}
      </div>
    );
  }

  // Full Kanban
  return (
    <div className="wk-root wk-full" ref={containerRef}>
      <div className="wk-board">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col}
            title={col}
            epics={byStatus[col]}
            maxCards={col === 'Done' ? DONE_MAX : undefined}
          />
        ))}
      </div>
    </div>
  );
}
