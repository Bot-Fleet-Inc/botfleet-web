/**
 * FleetLogoWallpaper — Interactive >_ pixel-art logo wall element
 * WEB-14 / Issue #40
 *
 * Renders the fleet-color `>_` glyph as an SVG pixel-art poster on the HQ wall.
 * Each bot-colored row of the `>` chevron is a clickable hover target
 * that links to the bot's profile page.
 *
 * Spec: 7-row chevron, PIXEL_SIZE = 32px, SVG-based.
 */

import { Link } from 'react-router-dom';
import './FleetLogoWallpaper.css';

const PIXEL_SIZE = 32;
const GAP = 16; // gap between > and _

// Row definitions for the > chevron
// Each row: { color, bot, emoji, label, link, cols: [start, end inclusive] }
const CHEVRON_ROWS = [
  {
    row: 0,
    color: '#1A1510',
    bot: null,
    cols: [0, 0], // 1 block
  },
  {
    row: 1,
    color: '#FFB347',
    bot: 'coding-bot',
    emoji: '💻',
    label: 'Coding Bot',
    link: '/bots/coding-bot',
    cols: [0, 1], // 2 blocks
  },
  {
    row: 2,
    color: '#FF6B8A',
    bot: 'design-bot',
    emoji: '🎨',
    label: 'Design Bot',
    link: '/bots/design-bot',
    cols: [0, 2], // 3 blocks
  },
  {
    row: 3,
    color: '#4ECDC4',
    bot: 'dispatch-bot',
    emoji: '📋',
    label: 'Dispatch Bot',
    link: '/bots/dispatch-bot',
    cols: [0, 3], // 4 blocks — apex
  },
  {
    row: 4,
    color: '#7BC67E',
    bot: 'archi-bot',
    emoji: '🏗️',
    label: 'Archi Bot',
    link: '/bots/archi-bot',
    cols: [0, 2], // 3 blocks
  },
  {
    row: 5,
    color: '#C3A6D4',
    bot: 'infra-bot',
    emoji: '⚙️',
    label: 'Infra Bot',
    link: '/bots/infra-bot',
    cols: [0, 1], // 2 blocks
  },
  {
    row: 6,
    color: '#1A1510',
    bot: null,
    cols: [0, 0], // 1 block
  },
];

// Max chevron width = 4 blocks (row 3 apex)
const CHEVRON_COLS = 4;

// Underscore: 4 blocks wide, at row 6 y position, to the right with gap
const UNDERSCORE_COLS = 4;
const UNDERSCORE_X = CHEVRON_COLS * PIXEL_SIZE + GAP;
const UNDERSCORE_Y = 6 * PIXEL_SIZE;

// SVG total dimensions
const SVG_WIDTH = UNDERSCORE_X + UNDERSCORE_COLS * PIXEL_SIZE;
const SVG_HEIGHT = 7 * PIXEL_SIZE;

// Background padding
const PAD = 16;

export function FleetLogoWallpaper({ className = '' }) {
  return (
    <div
      className={`fleet-logo-wallpaper ${className}`}
      aria-label="Bot Fleet Inc — interactive fleet logo"
    >
      <svg
        className="fleet-logo-wallpaper__svg"
        viewBox={`${-PAD} ${-PAD} ${SVG_WIDTH + PAD * 2} ${SVG_HEIGHT + PAD * 2}`}
        width={SVG_WIDTH + PAD * 2}
        height={SVG_HEIGHT + PAD * 2}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label=">_ fleet logo — hover to explore bots"
      >
        {/* Background */}
        <rect
          x={-PAD}
          y={-PAD}
          width={SVG_WIDTH + PAD * 2}
          height={SVG_HEIGHT + PAD * 2}
          fill="#5A4018"
          rx="4"
        />

        {/* > chevron rows */}
        {CHEVRON_ROWS.map((rowDef) => {
          const { row, color, bot, emoji, label, link, cols } = rowDef;
          const [colStart, colEnd] = cols;
          const blockCount = colEnd - colStart + 1;
          const x = colStart * PIXEL_SIZE;
          const y = row * PIXEL_SIZE;
          const width = blockCount * PIXEL_SIZE;
          const height = PIXEL_SIZE;
          const isInteractive = bot !== null;

          if (!isInteractive) {
            // Charcoal — no interaction
            return (
              <rect
                key={`row-${row}`}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={color}
              />
            );
          }

          // Bot-colored interactive row — wrap in foreignObject for Link
          return (
            <g key={`row-${row}`} className="fleet-logo-wallpaper__row-group">
              {/* Glow rect rendered behind — activated by CSS sibling/group hover */}
              <rect
                className={`fleet-logo-wallpaper__glow fleet-logo-wallpaper__glow--${bot}`}
                x={x - 2}
                y={y - 2}
                width={width + 4}
                height={height + 4}
                fill="none"
                rx="2"
                style={{ '--glow-color': color }}
              />
              {/* Pixel rect */}
              <rect
                className={`fleet-logo-wallpaper__pixel fleet-logo-wallpaper__pixel--${bot}`}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={color}
                rx="1"
                style={{ '--bot-color': color }}
              />
              {/* Clickable foreignObject overlay */}
              <foreignObject
                x={x}
                y={y}
                width={width}
                height={height}
                className={`fleet-logo-wallpaper__fo fleet-logo-wallpaper__fo--${bot}`}
                style={{ '--glow-color': color }}
              >
                <Link
                  xmlns="http://www.w3.org/1999/xhtml"
                  to={link}
                  className={`fleet-logo-wallpaper__link fleet-logo-wallpaper__link--${bot}`}
                  style={{ '--bot-color': color }}
                  aria-label={`${emoji} ${label} — click to view profile`}
                >
                  <span className="fleet-logo-wallpaper__tooltip">
                    {emoji} {label}
                  </span>
                </Link>
              </foreignObject>
            </g>
          );
        })}

        {/* _ underscore — no interaction */}
        <rect
          x={UNDERSCORE_X}
          y={UNDERSCORE_Y}
          width={UNDERSCORE_COLS * PIXEL_SIZE}
          height={PIXEL_SIZE}
          fill="#1A1510"
        />
      </svg>
    </div>
  );
}

export default FleetLogoWallpaper;
