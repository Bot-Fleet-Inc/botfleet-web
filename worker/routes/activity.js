/**
 * /api/activity — activity feed
 *
 * GET  /api/activity — return recent activity posts from Workers KV
 * POST /api/activity — receive GitHub webhook → store to KV
 *
 * Storage: Workers KV (binding: ACTIVITY)
 * Key schema: activity:{iso-timestamp}:{uuid}  → JSON ActivityPost
 * Note: D1 is planned post-PoC when CF token gains D1:Edit permission.
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
 *   ?type=<event>     Filter by event_type
 *   ?repo=<name>      Filter by repo
 */
export const handleGetActivity = wrapRoute(async (request, env) => {
  const kv = env.ACTIVITY;
  if (!kv) return jsonError('ACTIVITY KV binding not configured', 503, request);

  const url   = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? PAGE_SIZE, 10), 50);
  const type  = url.searchParams.get('type') ?? null;
  const repo  = url.searchParams.get('repo') ?? null;

  // List all keys with prefix "activity:" sorted newest-first (keys use ISO timestamps)
  const listed = await kv.list({ prefix: 'activity:', limit: 200 });
  const keys = listed.keys.map((k) => k.name).reverse(); // newest first (ISO sort)

  // Fetch values in parallel, filter, slice
  const rawValues = await Promise.all(
    keys.slice(0, Math.min(keys.length, limit * 5)).map((k) => kv.get(k, 'json'))
  );

  let posts = rawValues.filter(Boolean);

  if (type) posts = posts.filter((p) => p.eventType === type);
  if (repo) posts = posts.filter((p) => p.repo === repo);

  posts = posts.slice(0, limit);

  return jsonOk(
    { posts, meta: { total: posts.length, limit } },
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
 */
export const handlePostActivity = wrapRoute(async (request, env) => {
  const kv = env.ACTIVITY;
  if (!kv) return jsonError('ACTIVITY KV binding not configured', 503, request);

  // Verify signature if secret is configured
  const secret = env.WEBHOOK_SECRET;
  if (secret) {
    const sig  = request.headers.get('X-Hub-Signature-256') ?? '';
    const body = await request.clone().text();
    const valid = await verifyWebhookSignature(body, sig, secret);
    if (!valid) return jsonError('Invalid webhook signature', 401, request);
  }

  const event   = request.headers.get('X-GitHub-Event') ?? 'unknown';
  const payload = await request.json();

  const post = webhookToPost(event, payload);
  if (!post) {
    return jsonOk({ ok: true, stored: false, reason: 'unhandled event type' }, request);
  }

  // Key: activity:{ISO timestamp}:{eventId} → deterministic + sorted
  const ts  = new Date(post.createdAt).toISOString();
  const key = `activity:${ts}:${post.githubEventId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  // Idempotent: only write if key doesn't already exist
  const existing = await kv.get(key);
  if (!existing) {
    // TTL: 30 days (2592000 seconds)
    await kv.put(key, JSON.stringify(post), { expirationTtl: 2592000 });
  }

  return jsonOk({ ok: true, stored: !existing, key, eventType: post.eventType }, request);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function webhookToPost(event, payload) {
  const repo   = payload.repository?.full_name ?? 'unknown/unknown';
  const actor  = payload.sender?.login         ?? 'unknown';
  const avatar = payload.sender?.avatar_url    ?? null;

  // Enrich actor display name with bot profile if known
  const botProfile   = getBotProfile(actor);
  const actorDisplay = botProfile ? `${botProfile.emoji} ${botProfile.name}` : actor;

  if (event === 'issues') {
    const action = payload.action;
    if (!['opened', 'closed', 'reopened'].includes(action)) return null;

    const issue     = payload.issue;
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
      actor:       actorDisplay,
      actorAvatar: avatar,
      title:       issue.title,
      body:        voiceBody ?? issue.body ?? '',
      url:         issue.html_url,
      labels:      (issue.labels ?? []).map((l) => l.name),
      createdAt:   issue.created_at,
    };
  }

  if (event === 'issue_comment' && payload.action === 'created') {
    const issue   = payload.issue;
    const comment = payload.comment;

    return {
      githubEventId: `comment-${comment.id}`,
      eventType:     'issue_comment',
      repo,
      actor:       actorDisplay,
      actorAvatar: avatar,
      title:       `Re: ${issue.title}`,
      body:        comment.body,
      url:         comment.html_url,
      labels:      (issue.labels ?? []).map((l) => l.name),
      createdAt:   comment.created_at,
      parentIssue: {
        number: issue.number,
        title:  issue.title,
        url:    issue.html_url,
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
      actor:       actorDisplay,
      actorAvatar: avatar,
      title:       pr.title,
      body:        voiceBody ?? pr.body ?? '',
      url:         pr.html_url,
      labels:      (pr.labels ?? []).map((l) => l.name),
      createdAt:   pr.created_at,
    };
  }

  return null;
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
  return `sha256=${hex}` === signature;
}
