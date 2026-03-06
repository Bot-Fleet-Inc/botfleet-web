/**
 * /api/activity — activity feed
 *
 * GET  /api/activity — return activity_posts with comments + reactions from D1
 * POST /api/activity — receive GitHub webhook → insert into D1 activity feed
 */

import { jsonOk, jsonError, wrapRoute } from '../lib/cors.js';
import { generateVoicePost, getBotProfile } from '../lib/botvoice.js';

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// GET /api/activity
// ---------------------------------------------------------------------------

/**
 * GET /api/activity
 * Query params:
 *   ?limit=20         Max posts (1–50)
 *   ?offset=0         Pagination offset
 *   ?type=<event>     Filter by event_type
 *   ?repo=<name>      Filter by repo
 */
export const handleGetActivity = wrapRoute(async (request, env) => {
  const db = env.DB;
  if (!db) return jsonError('D1 database not bound', 503, request);

  const url    = new URL(request.url);
  const limit  = Math.min(parseInt(url.searchParams.get('limit')  ?? PAGE_SIZE, 10), 50);
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? 0,         10), 0);
  const type   = url.searchParams.get('type')  ?? null;
  const repo   = url.searchParams.get('repo')  ?? null;

  // Build WHERE clause
  const conditions = [];
  const binds      = [];
  if (type) { conditions.push('p.event_type = ?'); binds.push(type); }
  if (repo) { conditions.push('p.repo = ?');       binds.push(repo); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Fetch posts
  const postsSql = `
    SELECT
      p.id, p.github_event_id, p.event_type, p.repo,
      p.actor, p.actor_avatar, p.title, p.body, p.url,
      p.labels, p.created_at, p.indexed_at
    FROM activity_posts p
    ${where}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const postsResult = await db
    .prepare(postsSql)
    .bind(...binds, limit, offset)
    .all();

  const posts = postsResult.results ?? [];

  if (posts.length === 0) {
    return jsonOk({ posts: [], meta: { total: 0, limit, offset } }, request);
  }

  // Fetch comments for these posts
  const postIds = posts.map((p) => p.id);
  const placeholders = postIds.map(() => '?').join(',');

  const commentsSql = `
    SELECT id, post_id, github_comment_id, author, author_avatar, body, created_at
    FROM activity_comments
    WHERE post_id IN (${placeholders})
    ORDER BY created_at ASC
  `;
  const commentsResult = await db
    .prepare(commentsSql)
    .bind(...postIds)
    .all();

  // Fetch reactions
  const reactionsSql = `
    SELECT post_id, emoji, count
    FROM reactions
    WHERE post_id IN (${placeholders})
  `;
  const reactionsResult = await db
    .prepare(reactionsSql)
    .bind(...postIds)
    .all();

  // Join
  const commentsByPost  = groupBy(commentsResult.results  ?? [], 'post_id');
  const reactionsByPost = groupBy(reactionsResult.results ?? [], 'post_id');

  const enriched = posts.map((p) => ({
    ...p,
    labels:    safeJson(p.labels, []),
    comments:  (commentsByPost[p.id]  ?? []).map(formatComment),
    reactions: (reactionsByPost[p.id] ?? []).map(formatReaction),
  }));

  // Count total
  const countSql = `SELECT COUNT(*) as total FROM activity_posts p ${where}`;
  const countRow = await db.prepare(countSql).bind(...binds).first();
  const total    = countRow?.total ?? 0;

  return jsonOk(
    { posts: enriched, meta: { total, limit, offset } },
    request,
  );
});

// ---------------------------------------------------------------------------
// POST /api/activity  — GitHub webhook receiver
// ---------------------------------------------------------------------------

/**
 * POST /api/activity
 * Accepts GitHub webhook events (issues, pull_request, issue_comment).
 * Verifies the X-Hub-Signature-256 header if WEBHOOK_SECRET is configured.
 *
 * Bot Fleet GitHub app should point the webhook here.
 */
export const handlePostActivity = wrapRoute(async (request, env) => {
  const db = env.DB;
  if (!db) return jsonError('D1 database not bound', 503, request);

  // Verify signature if secret is configured
  const secret = env.WEBHOOK_SECRET;
  if (secret) {
    const sig = request.headers.get('X-Hub-Signature-256') ?? '';
    const body = await request.clone().text();
    const valid = await verifyWebhookSignature(body, sig, secret);
    if (!valid) return jsonError('Invalid webhook signature', 401, request);
  }

  const event   = request.headers.get('X-GitHub-Event') ?? 'unknown';
  const payload = await request.json();

  const post = webhookToPost(event, payload);
  if (!post) {
    // Event type we don't care about — accept but don't store
    return jsonOk({ ok: true, stored: false, reason: 'unhandled event type' }, request);
  }

  // Upsert post (idempotent on github_event_id)
  try {
    const insertPost = `
      INSERT OR IGNORE INTO activity_posts
        (github_event_id, event_type, repo, actor, actor_avatar,
         title, body, url, labels, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.prepare(insertPost).bind(
      post.githubEventId,
      post.eventType,
      post.repo,
      post.actor,
      post.actorAvatar,
      post.title,
      post.body,
      post.url,
      JSON.stringify(post.labels ?? []),
      post.createdAt,
    ).run();

    // If this is a comment event, attach to the parent post
    if (post.comment) {
      const parent = await db
        .prepare('SELECT id FROM activity_posts WHERE github_event_id = ?')
        .bind(`issue-${post.comment.issueNumber}`)
        .first();

      if (parent) {
        await db.prepare(`
          INSERT OR IGNORE INTO activity_comments
            (post_id, github_comment_id, author, author_avatar, body, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          parent.id,
          post.comment.id,
          post.comment.author,
          post.comment.authorAvatar,
          post.comment.body,
          post.comment.createdAt,
        ).run();
      }
    }

    return jsonOk({ ok: true, stored: true, eventType: post.eventType }, request);
  } catch (err) {
    console.error('[activity webhook]', err);
    return jsonError('Failed to store event', 500, request);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function webhookToPost(event, payload) {
  const repo   = payload.repository?.full_name ?? 'unknown/unknown';
  const actor  = payload.sender?.login         ?? 'unknown';
  const avatar = payload.sender?.avatar_url    ?? null;

  // Enrich actor with bot profile if known
  const botProfile = getBotProfile(actor);
  const actorDisplay = botProfile ? `${botProfile.emoji} ${botProfile.name}` : actor;

  if (event === 'issues') {
    const action = payload.action;
    if (!['opened', 'closed', 'reopened'].includes(action)) return null;

    const issue = payload.issue;
    const eventType = `issue_${action}`;
    const voiceBody = generateVoicePost(actor, eventType, {
      number: issue.number,
      title:  issue.title,
      repo,
    });

    return {
      githubEventId: `issue-${issue.number}`,
      eventType,
      repo,
      actor: actorDisplay,
      actorAvatar:   avatar,
      title:         issue.title,
      body:          voiceBody ?? issue.body ?? '',
      url:           issue.html_url,
      labels:        (issue.labels ?? []).map((l) => l.name),
      createdAt:     issue.created_at,
    };
  }

  if (event === 'issue_comment' && payload.action === 'created') {
    const issue   = payload.issue;
    const comment = payload.comment;
    return {
      // Insert a synthetic "stub" post for this issue if not present yet
      githubEventId: `issue-${issue.number}`,
      eventType:     'issue_opened',
      repo,
      actor:         issue.user?.login  ?? actor,
      actorAvatar:   issue.user?.avatar_url ?? avatar,
      title:         issue.title,
      body:          issue.body ?? '',
      url:           issue.html_url,
      labels:        (issue.labels ?? []).map((l) => l.name),
      createdAt:     issue.created_at,
      comment: {
        id:          String(comment.id),
        issueNumber: issue.number,
        author:      actor,
        authorAvatar: avatar,
        body:        comment.body,
        createdAt:   comment.created_at,
      },
    };
  }

  if (event === 'pull_request') {
    const action = payload.action;
    if (!['opened', 'closed'].includes(action)) return null;

    const pr        = payload.pull_request;
    const eventType = action === 'closed' && pr.merged ? 'pr_merged' : `pr_${action}`;
    const voiceBody = generateVoicePost(actor, eventType, {
      number: pr.number,
      title:  pr.title,
      repo,
    });

    return {
      githubEventId: `pr-${pr.number}`,
      eventType,
      repo,
      actor: actorDisplay,
      actorAvatar:  avatar,
      title:        pr.title,
      body:         voiceBody ?? pr.body ?? '',
      url:          pr.html_url,
      labels:       (pr.labels ?? []).map((l) => l.name),
      createdAt:    pr.created_at,
    };
  }

  return null;
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

function formatComment(c) {
  return {
    id: c.id,
    author: c.author,
    authorAvatar: c.author_avatar,
    body: c.body,
    createdAt: c.created_at,
  };
}

function formatReaction(r) {
  return { emoji: r.emoji, count: r.count };
}

function safeJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

async function verifyWebhookSignature(body, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const expected = `sha256=${hex}`;
  return expected === signature;
}
