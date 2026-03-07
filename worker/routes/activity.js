/**
 * /api/activity — activity feed
 *
 * KV-optimised: uses a single aggregated key "activity:feed" (JSON array).
 * Old model: 1 list + N gets per request (up to 101 KV ops).
 * New model: 1 get (read) or 1 get + 1 put (write) = ~2 ops total.
 *
 * GET  /api/activity — return recent posts from single KV key
 * POST /api/activity — receive GitHub webhook → prepend to KV array
 */

import { jsonOk, jsonError, wrapRoute } from '../lib/cors.js';
import { generateVoicePost, getBotProfile } from '../lib/botvoice.js';

const FEED_KEY  = 'activity:feed';
const MAX_STORE = 100; // keep last 100 events in KV
const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// GET /api/activity — 1 KV read
// ---------------------------------------------------------------------------
export const handleGetActivity = wrapRoute(async (request, env) => {
  const kv = env.ACTIVITY;
  if (!kv) return jsonError('ACTIVITY KV binding not configured', 503, request);

  const url   = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? PAGE_SIZE, 10), 50);
  const type  = url.searchParams.get('type') ?? null;
  const repo  = url.searchParams.get('repo') ?? null;

  // Single KV read
  let posts = (await kv.get(FEED_KEY, 'json')) ?? [];

  if (type) posts = posts.filter((p) => p.eventType === type);
  if (repo) posts = posts.filter((p) => p.repo === repo);

  posts = posts.slice(0, limit);

  const res = jsonOk({ posts, meta: { total: posts.length, limit } }, request);
  // Allow browser/edge to cache for 30s — reduces repeat KV reads further
  res.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  return res;
});

// ---------------------------------------------------------------------------
// POST /api/activity — GitHub webhook receiver (1 read + 1 write)
// ---------------------------------------------------------------------------
export const handlePostActivity = wrapRoute(async (request, env) => {
  const kv = env.ACTIVITY;
  if (!kv) return jsonError('ACTIVITY KV binding not configured', 503, request);

  const secret = env.WEBHOOK_SECRET;
  if (secret) {
    const sig = request.headers.get('x-hub-signature-256') ?? '';
    if (!sig) return jsonError('Missing signature', 401, request);
    const body = await request.clone().arrayBuffer();
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', key, body);
    const expected = 'sha256=' + Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (sig !== expected) return jsonError('Invalid signature', 401, request);
  }

  const event = request.headers.get('x-github-event') ?? 'unknown';
  let payload;
  try { payload = await request.json(); } catch { return jsonError('Invalid JSON', 400, request); }

  const post = await generateVoicePost(event, payload, env);
  if (!post) return jsonOk({ ok: true, skipped: true }, request);

  // Read existing feed (1 read), prepend new post, trim, write back (1 write)
  const existing = (await kv.get(FEED_KEY, 'json')) ?? [];
  const updated  = [post, ...existing].slice(0, MAX_STORE);
  await kv.put(FEED_KEY, JSON.stringify(updated));

  // Write dispatch wake signal for issue closed or PR merged
  // dispatch-bot polls this key in its cron sweep and wakes immediately if set.
  // TTL: 300s — signal is consumed or expires; never blocks the activity response.
  try {
    const isIssueClosed  = event === 'issues' && payload.action === 'closed';
    const isPrMerged     = event === 'pull_request' &&
                           payload.action === 'closed' &&
                           payload.pull_request?.merged === true;

    if (isIssueClosed || isPrMerged) {
      const wakePayload = isPrMerged
        ? {
            event,
            repo:   payload.repository?.full_name,
            pr:     payload.pull_request?.number,
            title:  payload.pull_request?.title,
            closer: payload.sender?.login,
            ts:     Date.now(),
          }
        : {
            event,
            repo:   payload.repository?.full_name,
            issue:  payload.issue?.number,
            title:  payload.issue?.title,
            closer: payload.sender?.login,
            ts:     Date.now(),
          };

      await kv.put('dispatch:wake:pending', JSON.stringify(wakePayload), {
        expirationTtl: 300,
      });
    }
  } catch (_err) {
    // KV wake signal failure must never drop the activity event
  }

  return jsonOk({ ok: true, id: post.id }, request);
});
