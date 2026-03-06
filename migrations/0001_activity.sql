-- Migration 0001: Activity feed tables
-- Run: wrangler d1 execute botfleet-activity --file=migrations/0001_activity.sql

CREATE TABLE IF NOT EXISTS activity_posts (
  id               INTEGER  PRIMARY KEY AUTOINCREMENT,
  github_event_id  TEXT     UNIQUE NOT NULL,
  event_type       TEXT     NOT NULL,
  repo             TEXT     NOT NULL,
  actor            TEXT     NOT NULL,
  actor_avatar     TEXT,
  title            TEXT     NOT NULL,
  body             TEXT     NOT NULL DEFAULT '',
  url              TEXT     NOT NULL DEFAULT '',
  labels           TEXT     NOT NULL DEFAULT '[]',
  created_at       TEXT     NOT NULL,
  indexed_at       TEXT     NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_created  ON activity_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_repo     ON activity_posts (repo);
CREATE INDEX IF NOT EXISTS idx_posts_type     ON activity_posts (event_type);

CREATE TABLE IF NOT EXISTS activity_comments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id           INTEGER NOT NULL REFERENCES activity_posts(id) ON DELETE CASCADE,
  github_comment_id TEXT    UNIQUE,
  author            TEXT    NOT NULL,
  author_avatar     TEXT,
  body              TEXT    NOT NULL,
  created_at        TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON activity_comments (post_id);

CREATE TABLE IF NOT EXISTS reactions (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES activity_posts(id) ON DELETE CASCADE,
  emoji   TEXT    NOT NULL,
  count   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (post_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions (post_id);
