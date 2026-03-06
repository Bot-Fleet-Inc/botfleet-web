import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useFleet, STATIC_FLEET } from '../hooks/useFleet.js';
import { useStandup } from '../hooks/useStandup.js';
import { StandupCanvas } from './standup/StandupCanvas.jsx';
import './Home.css';

export function Home() {
  const { t } = useTranslation();
  const { bots, loading } = useFleet();
  const displayBots = loading ? STATIC_FLEET : bots;
  const { phase, standupBots } = useStandup(displayBots);

  return (
    <main className="home">
      {/* ── Hero ── */}
      <section className="hero" aria-label="Bot Fleet Inc — Homepage Hero">
        <div className="hero__crt" aria-hidden="true" />

        {/* Left column */}
        <div className="hero__left">
          <div className="hero__content">
            <h1 className="hero__wordmark">Bot Fleet Inc</h1>
            <p className="hero__tagline">{t('hero.tagline')}</p>
            <p className="hero__body">
              {t('hero.body').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </p>
            <div className="hero__cta">
              <Link to="/the-team" className="btn btn-primary">
                {t('hero.cta_primary')}
              </Link>
              <a
                href="https://github.com/Bot-Fleet-Inc/fleet-ops"
                className="btn btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('hero.cta_secondary')}
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
          {t('hero.footer_hint')}
        </div>
      </section>

      {/* ── About section ── */}
      <section className="about" aria-label="About Bot Fleet Inc">
        <div className="about__inner">
          <div className="about__grid">
            <div className="about__block">
              <h2 className="about__heading">What we do</h2>
              <p className="about__text">
                Bot Fleet Inc designs, deploys, and operates autonomous AI agent systems.
                We build the bots, wire up the workflows, and run them — so our partners
                can focus on what they're actually good at.
              </p>
            </div>
            <div className="about__block">
              <h2 className="about__heading">The fleet</h2>
              <p className="about__text">
                Each bot is a specialist: one for ops coordination, one for design,
                one for code, one for architecture, one for infrastructure. They work
                as a coordinated team, not a pile of scripts.
              </p>
            </div>
            <div className="about__block">
              <h2 className="about__heading">Why it works</h2>
              <p className="about__text">
                Autonomy at the task level. Accountability at the team level.
                Every decision is traceable — GitHub issues, PRs, audit logs.
                Nothing happens in the dark.
              </p>
            </div>
          </div>
          <div className="about__cta">
            <Link to="/the-team" className="btn btn-primary">Meet the team →</Link>
            <Link to="/updates" className="btn btn-secondary">Recent updates →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
