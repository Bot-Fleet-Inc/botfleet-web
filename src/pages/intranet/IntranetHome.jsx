/**
 * IntranetHome — intranet.bot-fleet.org
 * Fleet dashboard: org chart, live bot status, current epics
 * WEB-5
 */
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFleet, STATIC_FLEET } from '../../hooks/useFleet.js'
import { useEpics, STATIC_EPICS } from '../../hooks/useEpics.js'
import { StatusBadge } from '../../components/StatusDot.jsx'
import './IntranetHome.css'

const BOT_COLOR = {
  'dispatch-bot': 'var(--color-dispatch)',
  'design-bot':   'var(--color-design)',
  'archi-bot':    'var(--color-archi)',
  'coding-bot':   'var(--color-coding)',
  'infra-bot':    'var(--color-infra)',
}

const ORG_TIERS = {
  ceo: { name: 'Jørgen', role: 'Founder & CEO', emoji: '👤', isHuman: true },
  leadership: ['dispatch-bot', 'archi-bot'],
  specialists: ['design-bot', 'coding-bot', 'infra-bot'],
}

function BotNode({ bot, compact = false }) {
  const colorKey = bot.name?.replace('-bot', '') ?? 'coding'
  const color = BOT_COLOR[bot.name] ?? 'var(--color-coding)'

  return (
    <Link
      to={`/intranet/bots/${bot.name}`}
      className={`bot-node${compact ? ' bot-node--compact' : ''}`}
      style={{ '--bot-color': color }}
      data-status={bot.status ?? 'unknown'}
    >
      <span className="bot-node__emoji">{bot.emoji ?? '🤖'}</span>
      <span className="bot-node__name">{bot.displayName}</span>
      <StatusBadge status={bot.status ?? 'unknown'} className="bot-node__status" />
      {bot.currentEpic && !compact && (
        <span className="bot-node__epic">↳ {bot.currentEpic.title}</span>
      )}
    </Link>
  )
}

export function IntranetHome() {
  const { t } = useTranslation()
  const { bots, loading: botsLoading } = useFleet()
  const { epics, loading: epicsLoading } = useEpics()

  const displayBots = botsLoading ? STATIC_FLEET : bots
  const displayEpics = epicsLoading ? STATIC_EPICS : epics

  const getBotByName = (name) =>
    displayBots.find(b => b.name === name) ?? {
      name,
      displayName: name.replace('-bot', '')[0].toUpperCase() + name.replace('-bot', '').slice(1),
      emoji: '🤖',
      status: 'unknown',
      currentEpic: null,
    }

  const openEpics = displayEpics.filter(e => e.state === 'open')

  return (
    <main className="intranet-home">

      {/* ─── Header ───────────────────────────────── */}
      <header className="intranet-home__header">
        <h1 className="intranet-home__title">
          <span className="intranet-home__title-label">INTRANET</span>
          Fleet Operations
        </h1>
        <p className="intranet-home__sub">
          {botsLoading ? t('team.loading') : `${displayBots.filter(b => b.status === 'active' || b.status === 'online').length} / ${displayBots.length} bots active`}
        </p>
        <div className="intranet-home__links">
          <Link to="/intranet/epics" className="intranet-link">Epics timeline →</Link>
        </div>
      </header>

      {/* ─── Org Chart ────────────────────────────── */}
      <section className="intranet-org" aria-label="Fleet org chart">
        <h2 className="intranet-section-title">Org Chart</h2>

        {/* CEO */}
        <div className="intranet-org__tier intranet-org__tier--ceo">
          <div className="intranet-org__human">
            <span className="intranet-org__human-emoji">{ORG_TIERS.ceo.emoji}</span>
            <span className="intranet-org__human-name">{ORG_TIERS.ceo.name}</span>
            <span className="intranet-org__human-role">{ORG_TIERS.ceo.role}</span>
          </div>
        </div>

        <div className="intranet-org__connector" aria-hidden="true" />

        {/* Leadership */}
        <div className="intranet-org__tier intranet-org__tier--leadership">
          {ORG_TIERS.leadership.map(name => (
            <BotNode key={name} bot={getBotByName(name)} />
          ))}
        </div>

        <div className="intranet-org__connector" aria-hidden="true" />

        {/* Specialists */}
        <div className="intranet-org__tier intranet-org__tier--specialists">
          {ORG_TIERS.specialists.map(name => (
            <BotNode key={name} bot={getBotByName(name)} />
          ))}
        </div>
      </section>

      {/* ─── Active Epics ─────────────────────────── */}
      <section className="intranet-epics" aria-label="Active epics">
        <h2 className="intranet-section-title">
          Active Epics
          <Link to="/intranet/epics" className="intranet-link intranet-link--small">View timeline →</Link>
        </h2>
        {epicsLoading ? (
          <span className="spinner" />
        ) : openEpics.length === 0 ? (
          <p className="intranet-empty">No active epics.</p>
        ) : (
          <ul className="intranet-epics__list">
            {openEpics.map(epic => (
              <li key={epic.number} className="intranet-epics__item">
                <a href={epic.url} target="_blank" rel="noopener noreferrer" className="intranet-epics__link">
                  <span className="intranet-epics__num">#{epic.number}</span>
                  <span className="intranet-epics__title">{epic.title}</span>
                  <span className="intranet-epics__arrow">↗</span>
                </a>
                {epic.linkedBots?.length > 0 && (
                  <div className="intranet-epics__bots">
                    {epic.linkedBots.map(b => (
                      <Link key={b} to={`/intranet/bots/${b}`} className="intranet-epics__bot-chip"
                        style={{ '--bot-color': BOT_COLOR[b] ?? 'var(--color-coding)' }}>
                        {b.replace('-bot', '')}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── Full Roster ──────────────────────────── */}
      <section className="intranet-roster" aria-label="Full fleet roster">
        <h2 className="intranet-section-title">All Bots</h2>
        <div className="intranet-roster__grid">
          {displayBots.map(bot => (
            <BotNode key={bot.name} bot={bot} compact />
          ))}
        </div>
      </section>

    </main>
  )
}
