/**
 * BotCard — /the-team bot card component
 * Spec: WEB-2-bot-card-spec.md (design-bot · 2026-03-06)
 */
import { useRef, useCallback } from 'react'
import './BotCard.css'

const STATUS_LABEL = {
  en: { online: 'Online', working: 'Working', idle: 'Idle', offline: 'Offline', loading: '...' },
  no: { online: 'Online', working: 'Jobber', idle: 'Inaktiv', offline: 'Offline', loading: '...' },
}

export function BotCard({ bot, lang = 'no', variant = 'default' }) {
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

  const status = bot.status ?? 'offline'
  const statusLabel = STATUS_LABEL[lang]?.[status] ?? status

  return (
    <article
      className={`bot-card bot-card--${variant}`}
      data-bot={bot.id}
      data-status={status}
      style={{ '--bot-color': bot.color }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="bot-card__avatar">
        <img
          ref={imgRef}
          src={bot.sprite.rest}
          data-rest={bot.sprite.rest}
          alt={bot.displayName}
          className="bot-card__sprite pixel-art"
          width={120}
          height={150}
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="bot-card__avatar-fallback" aria-hidden="true">
          {bot.displayName[0]}
        </div>
      </div>

      <div className="bot-card__body">
        <header className="bot-card__header">
          <h2 className="bot-card__name">{bot.displayName}</h2>
          <span className="bot-card__status-badge" aria-label={statusLabel}>
            <span className="bot-card__status-dot" aria-hidden="true" />
            {statusLabel}
          </span>
        </header>

        <p className="bot-card__role">{bot.role[lang]}</p>

        {bot.currentEpic && (
          <p className="bot-card__epic">
            ↳ {bot.currentEpic.title}
          </p>
        )}

        <blockquote className="bot-card__pitch">
          {bot.pitch[lang]}
        </blockquote>

        <footer className="bot-card__footer">
          <a
            href={`https://github.com/${bot.githubUser}`}
            className="bot-card__link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${bot.displayName} on GitHub`}
          >
            GitHub ↗
          </a>
          <span className="bot-card__color-swatch" aria-hidden="true" />
        </footer>
      </div>
    </article>
  )
}
