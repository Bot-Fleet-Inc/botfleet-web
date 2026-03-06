import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BotSprite } from './BotSprite.jsx';
import { StatusDot } from './StatusDot.jsx';
import './BotHeroUnit.css';

export function BotHeroUnit({ bot }) {
  const { t } = useTranslation();
  const colorKey = bot.name.replace('-bot', '');

  const statusLabel =
    bot.status === 'active' || bot.status === 'online'
      ? t('status.online')
      : bot.status === 'Provisioning' || bot.status === 'in-progress'
      ? t('status.busy')
      : t('status.offline');

  return (
    <Link
      to={`/bots/${bot.name}`}
      className="bot-hero-unit"
      data-bot={colorKey}
      aria-label={`${bot.displayName} — ${statusLabel}`}
    >
      <BotSprite
        botName={bot.name}
        alt={bot.displayName}
        width={96}
        height={120}
        className="bot-hero-unit__sprite"
      />
      <span className="bot-hero-unit__name">{bot.displayName}</span>
      <span className="bot-hero-unit__status">
        <StatusDot status={bot.status ?? 'unknown'} />
        {statusLabel}
      </span>
    </Link>
  );
}
