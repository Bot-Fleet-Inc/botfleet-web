import { useTranslation } from 'react-i18next';
import { BotCard } from '../components/BotCard.jsx';
import { useFleet, STATIC_FLEET } from '../hooks/useFleet.js';
import './TheTeam.css';

// Org chart structure
const ORG_CHART = {
  ceo: {
    name: 'Jørgen',
    role: 'Founder & CEO',
    emoji: '👤',
    githubUser: 'jorgen-fleet-boss',
    status: 'online',
    isHuman: true,
  },
  leadership: ['dispatch-bot', 'archi-bot'],
  specialists: ['design-bot', 'coding-bot', 'infra-bot'],
  future: ['audit-bot'],
};

export function TheTeam() {
  const { t } = useTranslation();
  const { bots, loading, error } = useFleet();
  const displayBots = loading ? STATIC_FLEET : bots;

  const getBotByName = (name) =>
    displayBots.find((b) => b.name === name) ?? {
      name,
      displayName: name.replace('-bot', '').charAt(0).toUpperCase() + name.replace('-bot', '').slice(1),
      emoji: '🤖',
      role: '—',
      status: 'unknown',
      currentEpic: null,
      currentIssues: [],
    };

  const leadershipBots = ORG_CHART.leadership.map(getBotByName);
  const specialistBots = ORG_CHART.specialists.map(getBotByName);

  return (
    <main className="the-team">
      {/* ── Header ── */}
      <header className="the-team__header">
        <h1 className="the-team__title">{t('team.title')}</h1>
        <p className="the-team__subtitle">{t('team.subtitle')}</p>
      </header>

      {/* ── Org Chart visual ── */}
      <section className="org-chart" aria-label="Organisation chart">
        {/* CEO */}
        <div className="org-chart__tier org-chart__tier--ceo">
          <div className="org-chart__node org-chart__node--human">
            <span className="org-chart__emoji">{ORG_CHART.ceo.emoji}</span>
            <span className="org-chart__node-name">{ORG_CHART.ceo.name}</span>
            <span className="org-chart__node-role">{ORG_CHART.ceo.role}</span>
          </div>
        </div>

        <div className="org-chart__connector" aria-hidden="true" />

        {/* Leadership tier */}
        <div className="org-chart__tier org-chart__tier--leadership">
          {leadershipBots.map((bot) => (
            <div key={bot.name} className="org-chart__node org-chart__node--bot"
              data-bot={bot.name.replace('-bot', '')}>
              <span className="org-chart__emoji">{bot.emoji}</span>
              <span className="org-chart__node-name">{bot.displayName}</span>
              <span className="org-chart__node-role">{bot.role.split('—')[0].trim()}</span>
            </div>
          ))}
        </div>

        <div className="org-chart__connector" aria-hidden="true" />

        {/* Specialist tier */}
        <div className="org-chart__tier org-chart__tier--specialists">
          {specialistBots.map((bot) => (
            <div key={bot.name} className="org-chart__node org-chart__node--bot"
              data-bot={bot.name.replace('-bot', '')}>
              <span className="org-chart__emoji">{bot.emoji}</span>
              <span className="org-chart__node-name">{bot.displayName}</span>
              <span className="org-chart__node-role">{bot.role.split('—')[0].trim()}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Status ── */}
      {loading && (
        <div className="the-team__loading" role="status" aria-live="polite">
          <span className="spinner" />
          {t('team.loading')}
        </div>
      )}
      {error && (
        <p className="the-team__error" role="alert">
          {t('team.error')} (showing cached data)
        </p>
      )}

      {/* ── Leadership cards ── */}
      <section className="the-team__section" aria-label={t('team.leadership')}>
        <h2 className="the-team__section-title">{t('team.leadership')}</h2>
        <div className="the-team__grid the-team__grid--leadership">
          {leadershipBots.map((bot) => (
            <BotCard key={bot.name} bot={bot} />
          ))}
        </div>
      </section>

      {/* ── Specialist cards ── */}
      <section className="the-team__section" aria-label={t('team.specialists')}>
        <h2 className="the-team__section-title">{t('team.specialists')}</h2>
        <div className="the-team__grid">
          {specialistBots.map((bot) => (
            <BotCard key={bot.name} bot={bot} />
          ))}
        </div>
      </section>
    </main>
  );
}
