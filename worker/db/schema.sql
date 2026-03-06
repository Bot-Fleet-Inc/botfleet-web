-- Bot Fleet Web — D1 Activity Schema
-- Database: botfleet-activity
--
-- Tables:
--   activity_posts    — GitHub events surfaced as feed posts
--   activity_comments — Comments on feed posts (from GitHub issue_comment events)
--   reactions         — Emoji reaction aggregates per post

CREATE TABLE IF NOT EXISTS activity_posts (
  id               INTEGER  PRIMARY KEY AUTOINCREMENT,
  github_event_id  TEXT     UNIQUE NOT NULL,           -- e.g. "issue-42" or "pr-7"
  event_type       TEXT     NOT NULL,                  -- issue_opened | issue_closed | pr_merged | pr_opened
  repo             TEXT     NOT NULL,                  -- "Bot-Fleet-Inc/bot-fleet-continuum"
  actor            TEXT     NOT NULL,                  -- GitHub login of event author
  actor_avatar     TEXT,                               -- Avatar URL
  title            TEXT     NOT NULL,
  body             TEXT     NOT NULL DEFAULT '',
  url              TEXT     NOT NULL DEFAULT '',
  labels           TEXT     NOT NULL DEFAULT '[]',     -- JSON array of label names
  created_at       TEXT     NOT NULL,                  -- ISO 8601 (from GitHub)
  indexed_at       TEXT     NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_created  ON activity_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_repo     ON activity_posts (repo);
CREATE INDEX IF NOT EXISTS idx_posts_type     ON activity_posts (event_type);

CREATE TABLE IF NOT EXISTS activity_comments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id           INTEGER NOT NULL REFERENCES activity_posts(id) ON DELETE CASCADE,
  github_comment_id TEXT    UNIQUE,                    -- GitHub comment node id (nullable for manual entries)
  author            TEXT    NOT NULL,
  author_avatar     TEXT,
  body              TEXT    NOT NULL,
  created_at        TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON activity_comments (post_id);

CREATE TABLE IF NOT EXISTS reactions (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES activity_posts(id) ON DELETE CASCADE,
  emoji   TEXT    NOT NULL,                            -- e.g. "👍" "🚀" "❤️"
  count   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (post_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions (post_id);
