import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BotCard } from '../components/BotCard.jsx';
import { BotSprite } from '../components/BotSprite.jsx';
import { useFleet, STATIC_FLEET } from '../hooks/useFleet.js';
import './TheTeam.css';

const R2_SPRITE = 'https://pub-9d8a85e5e17847949d36335948eeaee0.r2.dev/sprites';

// Correct hierarchy per WEB-2 / issue #21:
//   Jørgen
//   ├── Dispatch Bot   (leadership)
//   └── Audit Bot      (leadership, planned)
//       ├── Design Bot (specialist)
//       └── Coding Bot (specialist)
const HIERARCHY = {
  leadership: ['dispatch-bot', 'audit-bot'],
  specialists: ['design-bot', 'coding-bot'],   // reports to audit-bot
};

function JørgenNode() {
  return (
    <div className="org-chart__node org-chart__node--human" aria-label="Jørgen — Founder & CEO">
      <span className="org-chart__human-avatar" aria-hidden="true">JØ</span>
      <span className="org-chart__node-name">Jørgen</span>
      <span className="org-chart__node-role">Founder &amp; CEO</span>
    </div>
  );
}

function BotNode({ bot }) {
  const isPlanned = bot.status === 'planned';
  const colorKey  = bot.name.replace('-bot', '');

  if (isPlanned) {
    return (
      <div
        className="org-chart__node org-chart__node--bot org-chart__node--planned"
        data-bot={colorKey}
        aria-label={`${bot.displayName} — coming soon`}
      >
        <div className="org-chart__sprite-wrap">
          <span className="org-chart__planned-badge">Planlagt</span>
          <span className="org-chart__emoji" aria-hidden="true">{bot.emoji}</span>
        </div>
        <span className="org-chart__node-name">{bot.displayName}</span>
        <span className="org-chart__node-role">{bot.role?.split('—')[0].trim()}</span>
      </div>
    );
  }

  return (
    <Link
      to={`/bots/${bot.name}`}
      className="org-chart__node org-chart__node--bot"
      data-bot={colorKey}
      aria-label={`View ${bot.displayName} profile`}
    >
      <div className="org-chart__sprite-wrap">
        <BotSprite botName={bot.name} alt="" width={56} height={70} className="org-chart__sprite" />
      </div>
      <span className="org-chart__node-name">{bot.displayName}</span>
      <span className="org-chart__node-role">{bot.role?.split('—')[0].trim()}</span>
    </Link>
  );
}

export function TheTeam() {
  const { t } = useTranslation();
  const { bots, loading, error } = useFleet();

  // Use live data; fall back to static only when loading
  const liveBots = loading ? STATIC_FLEET : bots;

  // Build bot lookup — keyed by bot name
  const byName = Object.fromEntries(liveBots.map(b => [b.name, b]));

  // Only include bots present in API response or static fallback
  const leadershipBots = HIERARCHY.leadership
    .map(name => byName[name])
    .filter(Boolean);

  const specialistBots = HIERARCHY.specialists
    .map(name => byName[name])
    .filter(Boolean);

  // All displayable bots for cards section (exclude planned)
  const cardBots = [...leadershipBots, ...specialistBots].filter(
    b => b.status !== 'planned',
  );

  return (
    <main className="the-team">
      {/* ── Header ── */}
      <header className="the-team__header">
        <h1 className="the-team__title">{t('team.title')}</h1>
        <p className="the-team__subtitle">{t('team.subtitle')}</p>
      </header>

      {/* ── Org Chart ── */}
      <section className="org-chart" aria-label="Organisation chart">
        {/* Row 1: CEO */}
        <div className="org-chart__tier org-chart__tier--ceo">
          <JørgenNode />
        </div>

        <div className="org-chart__connector" aria-hidden="true" />

        {/* Row 2: Leadership */}
        <div className="org-chart__tier org-chart__tier--leadership">
          {leadershipBots.map(bot => (
            <BotNode key={bot.name} bot={bot} />
          ))}
        </div>

        <div className="org-chart__connector org-chart__connector--right" aria-hidden="true" />

        {/* Row 3: Specialists (under audit-bot) */}
        <div className="org-chart__tier org-chart__tier--specialists">
          {specialistBots.map(bot => (
            <BotNode key={bot.name} bot={bot} />
          ))}
        </div>
      </section>

      {/* ── Fleet Diagram (SVG from R2, inline fallback) ── */}
      <section className="the-team__diagram" aria-label="Fleet diagram">
        <h2 className="the-team__section-title">Fleet Diagram</h2>
      </section>

      {/* ── Status ── */}
      {loading && (
        <div className="the-team__loading" role="status" aria-live="polite">
          <span className="spinner" />
          {t('team.loading')}
        </div>
      )}
      {error && !loading && (
        <p className="the-team__error" role="alert">
          {t('team.error')} (viser bufret data)
        </p>
      )}

      {/* ── Bot cards ── */}
      <section className="the-team__section" aria-label={t('team.leadership')}>
        <h2 className="the-team__section-title">{t('team.leadership')}</h2>
        <div className="the-team__grid the-team__grid--leadership">
          {leadershipBots.filter(b => b.status !== 'planned').map(bot => (
            <BotCard key={bot.name} bot={bot} />
          ))}
        </div>
      </section>

      <section className="the-team__section" aria-label={t('team.specialists')}>
        <h2 className="the-team__section-title">{t('team.specialists')}</h2>
        <div className="the-team__grid">
          {specialistBots.map(bot => (
            <BotCard key={bot.name} bot={bot} />
          ))}
        </div>
      </section>
    </main>
  );
}
