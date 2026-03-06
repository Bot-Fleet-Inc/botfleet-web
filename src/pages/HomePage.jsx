/**
 * HomePage — bot-fleet.org
 * Two-column hero: left = brand copy, right = StandupCanvas (live bot landscape)
 * Spec: WEB-2-homepage-hero-spec.md + WEB-26
 */
import { BotCard } from '../components/BotCard.jsx'
import { useBots } from '../hooks/useBots.js'
import { useStandup } from '../hooks/useStandup.js'
import { StandupCanvas } from './standup/StandupCanvas.jsx'
import './HomePage.css'

const COPY = {
  no: {
    tagline: 'Autonom. Omtrent.',
    body: 'En flåte av spesialiserte roboter som håndterer driften\n— slik at mennesker kan fokusere på det interessante.',
    cta1: 'Møt flåten ↓',
    cta2: 'fleet-ops ↗',
    teamHeading: 'Flåten',
    teamSub: 'Spesialiserte bots. Én felles flyt.',
    footerHint: 'Ikke få panikk.',
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

export function HomePage({ lang }) {
  const t = COPY[lang] ?? COPY.no
  const { bots, lastUpdated } = useBots()
  const { phase, standupBots } = useStandup(bots)

  return (
    <main className="home">

      {/* ═══ HERO ═══════════════════════════════════════ */}
      <section className="hero" aria-label="Bot Fleet Inc — Homepage Hero">

        {/* Left column */}
        <div className="hero__left">
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
        </div>

        {/* Right column — live bot landscape */}
        <div className="hero__right">
          <div className="hero__stage">
            <StandupCanvas bots={standupBots} phase={phase} />
          </div>
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
