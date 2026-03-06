/**
 * HomePage — bot-fleet.org
 * Hero + /the-team section
 * Spec: WEB-2-homepage-hero-spec.md + WEB-2-bot-card-spec.md
 */
import { useRef, useCallback } from 'react'
import { BotCard } from '../components/BotCard.jsx'
import { useBots } from '../hooks/useBots.js'
import './HomePage.css'

const COPY = {
  no: {
    tagline: 'Autonom. Omtrent.',
    body: 'En flåte av spesialiserte roboter som håndterer driften\n— slik at mennesker kan fokusere på det interessante.',
    cta1: 'Møt flåten ↓',
    cta2: 'fleet-ops ↗',
    teamHeading: 'Flåten',
    teamSub: 'Spesialiserte bots. Én felles flyt.',
    footerHint: "Ikke få panikk.",
    lastUpdated: 'Sist oppdatert',
  },
  en: {
    tagline: 'Autonomous. Mostly.',
    body: 'A fleet of specialized bots running operations\nso humans can focus on the interesting parts.',
    cta1: 'Meet the Fleet ↓',
    cta2: 'fleet-ops ↗',
    teamHeading: 'The Fleet',
    teamSub: 'Specialized bots. One shared flow.',
    footerHint: "Don't Panic.",
    lastUpdated: 'Last updated',
  },
}

function HeroBot({ bot, lang }) {
  const imgRef = useRef(null)

  const handleMouseEnter = useCallback(() => {
    if (!imgRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    imgRef.current.src = bot.sprite.idle
  }, [bot.sprite.idle])

  const handleMouseLeave = useCallback(() => {
    if (!imgRef.current) return
    setTimeout(() => { if (imgRef.current) imgRef.current.src = bot.sprite.rest }, 0)
  }, [bot.sprite.rest])

  const statusMap = { online: '●', working: '◉', idle: '○', offline: '◌', loading: '·' }

  return (
    <div
      className="hero__bot"
      data-bot={bot.id}
      data-status={bot.status ?? 'offline'}
      style={{ '--bot-color': bot.color }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        ref={imgRef}
        src={bot.sprite.rest}
        alt={bot.displayName}
        className="hero__sprite pixel-art"
        width={120}
        height={150}
        onError={e => {
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'flex'
        }}
      />
      <div className="hero__sprite-fallback" aria-hidden="true" style={{ display: 'none' }}>
        {bot.displayName[0]}
      </div>
      <span className="hero__bot-name">{bot.displayName}</span>
      <span className="hero__bot-status">
        <span className="hero__status-dot" aria-hidden="true">{statusMap[bot.status] ?? '◌'}</span>
        {bot.status === 'working' ? (lang === 'no' ? 'Jobber' : 'Working') : (bot.status === 'online' ? 'Online' : (bot.status === 'idle' ? 'Idle' : 'Offline'))}
      </span>
    </div>
  )
}

export function HomePage({ lang }) {
  const t = COPY[lang]
  const { bots, lastUpdated } = useBots()

  return (
    <main className="home">

      {/* ═══ HERO ═══════════════════════════════════════ */}
      <section className="hero" aria-label="Bot Fleet Inc — Homepage Hero">
        <div className="hero__content">
          <h1 className="hero__wordmark">Bot Fleet Inc</h1>
          <p className="hero__tagline">{t.tagline}</p>
          <p className="hero__body">
            {t.body.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}
          </p>
          <div className="hero__cta">
            <a href="#the-team" className="btn-primary">{t.cta1}</a>
            <a
              href="https://github.com/Bot-Fleet-Inc/fleet-ops"
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.cta2}
            </a>
          </div>
        </div>

        <div className="hero__fleet-row" aria-label={t.teamHeading}>
          {bots.map(bot => (
            <HeroBot key={bot.id} bot={bot} lang={lang} />
          ))}
        </div>

        <div className="hero__footer-hint" aria-hidden="true">
          {t.footerHint}
        </div>
      </section>

      {/* ═══ THE TEAM ════════════════════════════════════ */}
      <section id="the-team" className="team-section" aria-labelledby="team-heading">
        <header className="team-section__header">
          <h2 id="team-heading" className="team-section__heading">{t.teamHeading}</h2>
          <p className="team-section__sub">{t.teamSub}</p>
          {lastUpdated && (
            <p className="team-section__updated">
              {t.lastUpdated}: {lastUpdated.toLocaleTimeString(lang === 'no' ? 'nb-NO' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </header>

        <div className="team-grid">
          {bots.map(bot => (
            <BotCard key={bot.id} bot={bot} lang={lang} />
          ))}
        </div>
      </section>

    </main>
  )
}
