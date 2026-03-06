/**
 * HomePage — full-viewport 2D Bot HQ landscape
 *
 * The entire viewport IS the office. Logo + tagline live inside the room
 * as interior elements — not as traditional UI hero components.
 *
 * Constraint (Jørgen, 2026-03-06):
 *   ✅ "Bot Fleet Inc" → wall sign inside the room
 *   ✅ "Autonom. Omtrent." → blackboard text inside the room
 *   ❌ No floating <h1> / hero section above the scene
 *
 * WEB-10 · botfleet-web#29
 */
import { useTranslation } from 'react-i18next'
import { useFleet, STATIC_FLEET } from '../hooks/useFleet.js'
import { HQRoom } from './HQRoom.jsx'

// Bot color map — matches tokens.css
const BOT_COLORS = {
  'dispatch-bot': 'var(--color-dispatch)',
  'design-bot':   'var(--color-design)',
  'coding-bot':   'var(--color-coding)',
  'archi-bot':    'var(--color-archi)',
  'infra-bot':    'var(--color-infra)',
  'audit-bot':    '#3FB950',
}

// Normalise API bot → HQRoom bot shape
function normalise(bot) {
  const id = bot.name?.replace('-bot', '') ?? bot.id ?? 'unknown'
  return {
    ...bot,
    id,
    // HQRoom uses 'standupStatus' for sprite + position logic
    standupStatus: normaliseStatus(bot.status),
    color: BOT_COLORS[bot.name] ?? 'var(--color-text)',
    emoji: bot.emoji ?? '🤖',
  }
}

function normaliseStatus(s) {
  if (!s) return 'idle'
  const map = {
    active: 'active', online: 'active', working: 'active',
    idle: 'idle', loading: 'idle', planned: 'idle',
    offline: 'idle', blocked: 'blocked', unknown: 'idle',
  }
  return map[s] ?? 'idle'
}

export function HomePage() {
  const { i18n } = useTranslation()
  const { bots, loading } = useFleet()

  const displayBots = loading ? STATIC_FLEET : bots
  const normalisedBots = displayBots
    .filter(b => b.status !== 'planned')
    .map(normalise)

  return (
    <HQRoom
      bots={normalisedBots}
      phase="idle"
      lang={i18n.language?.startsWith('no') ? 'no' : 'en'}
    />
  )
}
