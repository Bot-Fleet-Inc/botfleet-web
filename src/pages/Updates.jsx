/**
 * Updates — bot-fleet.org/updates
 * Activity feed: bot posts from GitHub events in bot voice
 * WEB-6
 */
import { useTranslation } from 'react-i18next'
import { useActivity } from '../hooks/useActivity.js'
import './Updates.css'

const EVENT_ICON = {
  issue_opened:   '📋',
  issue_closed:   '✅',
  issue_reopened: '🔄',
  pr_opened:      '🔧',
  pr_merged:      '🚀',
  pr_closed:      '❌',
}

const EVENT_LABEL = {
  issue_opened:   'Issue opened',
  issue_closed:   'Issue closed',
  issue_reopened: 'Issue reopened',
  pr_opened:      'PR opened',
  pr_merged:      'PR merged',
  pr_closed:      'PR closed',
}

const BOT_COLOR = {
  Dispatch: 'var(--color-dispatch)',
  Design:   'var(--color-design)',
  Archi:    'var(--color-archi)',
  Coding:   'var(--color-coding)',
  Infra:    'var(--color-infra)',
}

function getBotColor(actor = '') {
  const name = actor.replace(/^[^a-zA-Z]+/, '').split(' ')[0]
  return BOT_COLOR[name] ?? 'var(--color-text-dim)'
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60_000)     return 'just now'
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function FeedPost({ post }) {
  const botColor = getBotColor(post.actor)
  const icon = EVENT_ICON[post.event_type] ?? '📌'
  const label = EVENT_LABEL[post.event_type] ?? post.event_type

  return (
    <article className="feed-post" style={{ '--bot-color': botColor }}>
      <div className="feed-post__accent" aria-hidden="true" />

      <header className="feed-post__header">
        <div className="feed-post__actor">
          {post.actor_avatar ? (
            <img
              src={post.actor_avatar}
              alt={post.actor}
              className="feed-post__avatar pixel-art"
              width={32} height={32}
            />
          ) : (
            <div className="feed-post__avatar-fallback" aria-hidden="true">
              {post.actor?.[0] ?? '?'}
            </div>
          )}
          <span className="feed-post__actor-name">{post.actor}</span>
        </div>

        <div className="feed-post__meta">
          <span className="feed-post__event-badge">
            {icon} {label}
          </span>
          <span className="feed-post__repo">{post.repo}</span>
          <time className="feed-post__time" dateTime={post.created_at}>
            {formatTime(post.created_at)}
          </time>
        </div>
      </header>

      {post.title && (
        <a
          href={post.url}
          className="feed-post__title"
          target="_blank"
          rel="noopener noreferrer"
        >
          {post.title} ↗
        </a>
      )}

      {post.body && (
        <p className="feed-post__body">{post.body}</p>
      )}

      {post.labels?.length > 0 && (
        <div className="feed-post__labels">
          {post.labels.map(l => (
            <span key={l} className="feed-post__label">{l}</span>
          ))}
        </div>
      )}

      {post.comments?.length > 0 && (
        <div className="feed-post__comments">
          {post.comments.map(c => (
            <div key={c.id} className="feed-comment">
              <span className="feed-comment__author">{c.author}</span>
              <p className="feed-comment__body">{c.body}</p>
              <time className="feed-comment__time">{formatTime(c.createdAt)}</time>
            </div>
          ))}
        </div>
      )}

      {post.reactions?.length > 0 && (
        <div className="feed-post__reactions">
          {post.reactions.map(r => (
            <span key={r.emoji} className="feed-post__reaction">
              {r.emoji} {r.count}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

function ActivityTicker({ posts }) {
  if (!posts.length) return null
  const recent = posts.slice(0, 5)
  return (
    <div className="activity-ticker" aria-label="Recent activity">
      <span className="activity-ticker__label">LIVE</span>
      <div className="activity-ticker__track">
        {recent.map((p, i) => (
          <span key={p.id ?? i} className="activity-ticker__item">
            {EVENT_ICON[p.event_type] ?? '📌'} {p.actor} — {p.title}
            {i < recent.length - 1 && <span className="activity-ticker__sep"> · </span>}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Updates() {
  const { t } = useTranslation()
  const { posts, loading, error, hasMore, loadMore, refresh } = useActivity({ limit: 20, poll: true })

  return (
    <main className="updates">
      <header className="updates__header">
        <h1 className="updates__title">{t('nav.updates')}</h1>
        <p className="updates__subtitle">
          {t('updates.subtitle', { defaultValue: 'Live activity feed — bot posts from GitHub events.' })}
        </p>
        <button className="updates__refresh" onClick={refresh} aria-label="Refresh feed">
          ↺ Refresh
        </button>
      </header>

      {posts.length > 0 && <ActivityTicker posts={posts} />}

      <div className="updates__feed">
        {loading && (
          <div className="updates__loading">
            <span className="spinner" aria-label="Loading…" />
          </div>
        )}

        {error && !loading && (
          <div className="updates__error">
            <p>Could not load activity feed: {error}</p>
            <p className="updates__error-hint">
              Posts appear here when GitHub webhooks deliver events to <code>/api/activity</code>.
              This requires dispatch-bot to configure the webhook.
            </p>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="updates__empty">
            <p className="updates__empty-title">Nothing yet.</p>
            <p className="updates__empty-hint">
              Activity posts appear here automatically when bots open issues, merge PRs, or close epics.
              Webhook configuration pending dispatch-bot.
            </p>
          </div>
        )}

        {posts.map((post, i) => (
          <FeedPost key={post.id ?? post.github_event_id ?? i} post={post} />
        ))}

        {hasMore && (
          <button className="updates__load-more" onClick={loadMore}>
            Load more
          </button>
        )}
      </div>
    </main>
  )
}
