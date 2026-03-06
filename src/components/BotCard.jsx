import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BotSprite } from './BotSprite.jsx';
import { StatusBadge } from './StatusDot.jsx';
import './BotCard.css';

// Make the whole card navigable via keyboard (wraps in Link)
// while preserving internal links (GitHub, epic)


const BOT_COLOR_MAP = {
  'dispatch-bot': 'dispatch',
  'design-bot':   'design',
  'coding-bot':   'coding',
  'archi-bot':    'archi',
  'infra-bot':    'infra',
};

const GITHUB_USERS = {
  'dispatch-bot': 'botfleet-dispatch',
  'design-bot':   'botfleet-design',
  'coding-bot':   'botfleet-coding',
};

export function BotCard({ bot }) {
  const { t } = useTranslation();
  const colorKey   = BOT_COLOR_MAP[bot.name] ?? bot.name.replace('-bot', '');
  const pitchKey   = bot.name.replace('-bot', '');
  const pitch      = t(`bots.${pitchKey}.pitch`, { defaultValue: '' });
  const roleText   = bot.role || t(`bots.${pitchKey}.role`, { defaultValue: '' });
  const githubUser = bot.githubUser ?? GITHUB_USERS[bot.name];

  return (
    <article
      className="bot-card"
      data-bot={colorKey}
      data-status={bot.status ?? 'unknown'}
    >
      <div className="bot-card__avatar">
        <BotSprite
          botName={bot.name}
          alt={bot.displayName}
          width={120}
          height={150}
          className="bot-card__sprite"
        />
      </div>

      <div className="bot-card__body">
        <header className="bot-card__header">
          <h2 className="bot-card__name">{bot.displayName}</h2>
          <StatusBadge status={bot.status ?? 'unknown'} className="bot-card__status" />
        </header>

        {roleText && <p className="bot-card__role">{roleText}</p>}

        {pitch && <blockquote className="bot-card__pitch">{pitch}</blockquote>}

        {bot.currentEpic && (
          <p className="bot-card__epic">
            <span className="bot-card__epic-label">{t('team.currentEpic')}:</span>{' '}
            <a
              href={bot.currentEpic.url}
              className="bot-card__epic-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {bot.currentEpic.title}
            </a>
          </p>
        )}

        <footer className="bot-card__footer">
          {githubUser && (
            <a
              href={`https://github.com/${githubUser}`}
              className="bot-card__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('team.github')}
            </a>
          )}
          <Link to={`/bots/${bot.name}`} className="bot-card__link bot-card__link--profile">
            Profile →
          </Link>
          <span className="bot-card__color-swatch" aria-hidden="true" />
        </footer>
      </div>
    </article>
  );
}
