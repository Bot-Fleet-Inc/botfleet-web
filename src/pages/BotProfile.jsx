import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFleet, STATIC_FLEET } from '../hooks/useFleet.js';
import { BotSprite } from '../components/BotSprite.jsx';
import { StatusBadge } from '../components/StatusDot.jsx';
import './BotProfile.css';

export function BotProfile() {
  const { name } = useParams();
  const { t } = useTranslation();
  const { bots, loading } = useFleet();
  const displayBots = loading ? STATIC_FLEET : bots;
  const bot = displayBots.find((b) => b.name === name);
  const colorKey = name?.replace('-bot', '') ?? 'coding';
  const pitchKey = colorKey;

  if (!bot && !loading) {
    return (
      <main className="bot-profile">
        <p className="bot-profile__not-found">Bot "{name}" not found.</p>
        <Link to="/the-team" className="btn btn-secondary" style={{marginTop: '1rem'}}>
          ← Back to team
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="bot-profile bot-profile--loading">
        <span className="spinner" />
      </main>
    );
  }

  const pitch = t(`bots.${pitchKey}.pitch`, { defaultValue: bot.role });

  return (
    <main className="bot-profile" data-bot={colorKey}>
      <Link to="/the-team" className="bot-profile__back">← {t('team.title')}</Link>

      <header className="bot-profile__header">
        <BotSprite
          botName={bot.name}
          alt={bot.displayName}
          width={160}
          height={200}
          className="bot-profile__sprite"
        />
        <div className="bot-profile__meta">
          <h1 className="bot-profile__name">{bot.displayName}</h1>
          <StatusBadge status={bot.status ?? 'unknown'} className="bot-profile__status" />
          <p className="bot-profile__role">{bot.role}</p>
          <blockquote className="bot-profile__pitch">{pitch}</blockquote>
        </div>
      </header>

      {bot.currentEpic && (
        <section className="bot-profile__section">
          <h2 className="bot-profile__section-title">{t('team.currentEpic')}</h2>
          <a
            href={bot.currentEpic.url}
            className="bot-profile__epic-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {bot.currentEpic.title} ↗
          </a>
        </section>
      )}

      {bot.currentIssues?.length > 0 && (
        <section className="bot-profile__section">
          <h2 className="bot-profile__section-title">Active issues</h2>
          <ul className="bot-profile__issues">
            {bot.currentIssues.map((issue) => (
              <li key={issue.number} className="bot-profile__issue">
                <a href={issue.url} target="_blank" rel="noopener noreferrer">
                  #{issue.number} — {issue.title} ↗
                </a>
                <span className="bot-profile__issue-repo">{issue.repo}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bot-profile__section">
        <h2 className="bot-profile__section-title">Bot States Diagram</h2>
      </section>

      {bot.githubUser && (
        <section className="bot-profile__section">
          <h2 className="bot-profile__section-title">Links</h2>
          <a
            href={`https://github.com/${bot.githubUser}`}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('team.github')}
          </a>
        </section>
      )}
    </main>
  );
}
