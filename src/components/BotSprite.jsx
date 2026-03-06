import { useRef, useCallback } from 'react';

const SPRITE_BASE = 'https://raw.githubusercontent.com/Bot-Fleet-Inc/design-bot/main/design-system/sprites';

// Map bot names to sprite prefixes
const SPRITE_PREFIXES = {
  'dispatch-bot': 'dispatch',
  'design-bot':   'design',
  'coding-bot':   'coding',
  'archi-bot':    'archi',
  'infra-bot':    'infra',
};

function getPrefix(botName) {
  return SPRITE_PREFIXES[botName] ?? botName.replace(/-bot$/, '');
}

function randomIdle(prefix) {
  const n = Math.floor(Math.random() * 10) + 1;
  return `${SPRITE_BASE}/${prefix}-idle-${n}.gif`;
}

function restUrl(prefix) {
  return `${SPRITE_BASE}/${prefix}-rest.png`;
}

/**
 * Bot sprite image — shows rest.png by default,
 * swaps to a random idle GIF on mouseenter.
 */
export function BotSprite({ botName, alt, width = 120, height = 150, className = '' }) {
  const imgRef = useRef(null);
  const timerRef = useRef(null);
  const prefix = getPrefix(botName);

  const handleEnter = useCallback(() => {
    clearTimeout(timerRef.current);
    if (imgRef.current) {
      imgRef.current.src = randomIdle(prefix);
    }
  }, [prefix]);

  const handleLeave = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (imgRef.current) {
        imgRef.current.src = restUrl(prefix);
      }
    }, 800);
  }, [prefix]);

  return (
    <img
      ref={imgRef}
      src={restUrl(prefix)}
      alt={alt}
      width={width}
      height={height}
      className={`pixel-art ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      loading="lazy"
    />
  );
}
