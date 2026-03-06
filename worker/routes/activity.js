/**
 * /api/activity — activity feed
 *
 * GET  /api/activity — return activity posts from Workers KV
 * POST /api/activity — receive GitHub webhook → store in KV
 *
 * Storage: Workers KV (ACTIVITY binding)
 * Key schema: activity:post:{iso-timestamp}:{uuid}
 * Value: JSON ActivityPost object
 *
 * NOTE: D1 (activity_posts/activity_comments/reactions) is the target
 * schema for post-PoC. KV is used for the PoC phase while D1:Edit
 * CF token permission is pending.
 */

import { jsonOk, jsonError, wrapRoute } from '../lib/cors.js';
import { generateVoicePost, getBotProfile } from '../lib/botvoice.js';

const KV_PREFIX = 'activity:post:';
const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// GET /api/activity
// ---------------------------------------------------------------------------
export const handleGetActivity = wrapRoute(async (request, env) => {
  const kv = env.ACTIVITY;
  if (!kv) return jsonError('ACTIVITY KV namespace not bound', 503, request);

  const url    = new URL(request.url);
  const limit  = Math.min(parseInt(url.searchParams.get('limit')  ?? PAGE_SIZE, 10), 50);
  const cursor = url.searchParams.get('cursor') ?? undefined;

  // List keys newest-first (keys are prefixed with ISO timestamp — lexicographic desc)
  const list = await kv.list({ prefix: KV_PREFIX, limit, cursor });

  // KV list returns keys in ascending order — reverse for newest-first
  const keys = [...list.keys].reverse();

  const posts = await Promise.all(
    keys.map(async ({ name }) => {
      const val = await kv.get(name, { type: 'json' });
      return val;
    })
  );

  return jsonOk({
    posts:      posts.filter(Boolean),
    nextCursor: list.cursor ?? null,
    complete:   list.list_complete,
  }, request);
});

// ---------------------------------------------------------------------------
// POST /api/activity  (GitHub webhook)
// ---------------------------------------------------------------------------
export const handlePostActivity = wrapRoute(async (request, env) => {
  const kv = env.ACTIVITY;
  if (!kv) return jsonError('ACTIVITY KV namespace not bound', 503, request);

  // Verify signature if secret configured
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

  // Idempotency: check if this githubEventId already stored
  const dedupKey = `activity:dedup:${post.githubEventId}`;
  const existing = await kv.get(dedupKey);
  if (existing) {
    return jsonOk({ ok: true, stored: false, reason: 'duplicate' }, request);
  }

  // Store post — key includes timestamp for natural ordering
  const ts  = new Date(post.createdAt).toISOString().replace(/[:.]/g, '-');
  const uid = crypto.randomUUID().split('-')[0];
  const key = `${KV_PREFIX}${ts}:${uid}`;

  await kv.put(key, JSON.stringify(post), { expirationTtl: 60 * 60 * 24 * 90 }); // 90 days
  await kv.put(dedupKey, '1',             { expirationTtl: 60 * 60 * 24 * 90 });

  return jsonOk({ ok: true, stored: true, eventType: post.eventType, key }, request);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function webhookToPost(event, payload) {
  const repo   = payload.repository?.full_name ?? 'unknown/unknown';
  const actor  = payload.sender?.login         ?? 'unknown';
  const avatar = payload.sender?.avatar_url    ?? null;

  const botProfile  = getBotProfile(actor);
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
      id:             `issue-${issue.number}-${action}`,
      githubEventId:  `issue-${issue.number}`,
      eventType,
      repo,
      actor:          actorDisplay,
      actor_avatar:   avatar,
      title:          issue.title,
      body:           voiceBody ?? issue.body ?? '',
      url:            issue.html_url,
      labels:         (issue.labels ?? []).map(l => l.name),
      createdAt:      issue.created_at,
      comments:       [],
      reactions:      [],
    };
  }

  if (event === 'issue_comment' && payload.action === 'created') {
    const issue   = payload.issue;
    const comment = payload.comment;
    const voiceBody = generateVoicePost(actor, 'issue_comment', {
      number: issue.number,
      title:  issue.title,
      repo,
    });
    return {
      id:             `comment-${comment.id}`,
      githubEventId:  `comment-${comment.id}`,
      eventType:      'issue_comment',
      repo,
      actor:          actorDisplay,
      actor_avatar:   avatar,
      title:          `Re: ${issue.title}`,
      body:           voiceBody ?? comment.body,
      url:            comment.html_url,
      labels:         [],
      createdAt:      comment.created_at,
      comments:       [],
      reactions:      [],
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
      id:             `pr-${pr.number}-${eventType}`,
      githubEventId:  `pr-${pr.number}`,
      eventType,
      repo,
      actor:          actorDisplay,
      actor_avatar:   avatar,
      title:          pr.title,
      body:           voiceBody ?? pr.body ?? '',
      url:            pr.html_url,
      labels:         (pr.labels ?? []).map(l => l.name),
      createdAt:      pr.created_at,
      comments:       [],
      reactions:      [],
    };
  }

  return null;
}

async function verifyWebhookSignature(body, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256=${hex}` === signature;
}
