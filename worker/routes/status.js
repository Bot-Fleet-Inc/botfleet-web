/**
 * Status API endpoints
 * GET /api/status/github-rate  — GitHub API rate limit
 * GET /api/status/workers      — Cloudflare Workers health
 * GET /api/status/bots         — Bot fleet health (VM + heartbeat)
 */

import { jsonOk, jsonError, wrapRoute } from '../lib/cors.js';
import { cached, CACHE_KEYS, TTL } from '../lib/cache.js';

// ─── GitHub Rate Limit ────────────────────────────────────────────────────────

export const handleGitHubRate = wrapRoute(async (request, env) => {
  const token = env.GH_API_TOKEN;
  if (!token) return jsonError('GH_API_TOKEN not configured', 503, request);

  try {
    const res = await fetch('https://api.github.com/rate_limit', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'botfleet-web/1.0',
        Accept: 'application/vnd.github+json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return jsonError(`GitHub API returned ${res.status}`, 502, request);
    }

    const { rate, resources } = await res.json();

    return jsonOk({
      core: {
        limit: rate.limit,
        remaining: rate.remaining,
        reset: rate.reset,
        resetIn: Math.max(0, rate.reset - Math.floor(Date.now() / 1000)),
        percent: Math.round((rate.remaining / rate.limit) * 100),
      },
      graphql: resources?.graphql ?? null,
      status: rate.remaining > 100 ? 'ok' : rate.remaining > 10 ? 'warn' : 'critical',
    }, request);
  } catch (err) {
    return jsonError(`Failed to fetch rate limit: ${err.message}`, 502, request);
  }
});

// ─── Cloudflare Workers Health ─────────────────────────────────────────────────

export const handleWorkersHealth = wrapRoute(async (request, env) => {
  const startMs = Date.now();

  // Check KV namespaces are reachable
  const kvResults = await Promise.allSettled([
    env.CACHE ? env.CACHE.get('__health_check__').then(() => true) : Promise.reject(new Error('CACHE binding missing')),
    env.ACTIVITY ? env.ACTIVITY.get('__health_check__').then(() => true) : Promise.reject(new Error('ACTIVITY binding missing')),
  ]);

  // Check D1
  let d1Ok = false;
  let d1Error = null;
  try {
    if (env.DB) {
      await env.DB.prepare('SELECT 1').run();
      d1Ok = true;
    } else {
      d1Error = 'DB binding missing';
    }
  } catch (err) {
    d1Error = err.message;
  }

  const latencyMs = Date.now() - startMs;

  const cacheOk    = kvResults[0].status === 'fulfilled';
  const activityOk = kvResults[1].status === 'fulfilled';

  const overallStatus =
    cacheOk && activityOk && d1Ok ? 'ok'
    : cacheOk || activityOk ? 'degraded'
    : 'down';

  return jsonOk({
    status: overallStatus,
    latencyMs,
    checks: {
      kv_cache:    { ok: cacheOk,    error: kvResults[0].status === 'rejected' ? kvResults[0].reason?.message : null },
      kv_activity: { ok: activityOk, error: kvResults[1].status === 'rejected' ? kvResults[1].reason?.message : null },
      d1:          { ok: d1Ok,       error: d1Error },
    },
    timestamp: new Date().toISOString(),
  }, request);
});

// ─── Bot Fleet Health ──────────────────────────────────────────────────────────

const BOT_HEALTH_URLS = {
  'dispatch-bot': 'https://dispatch-bot.bot-fleet.workers.dev/health',
  'design-bot':   'https://design-bot.bot-fleet.workers.dev/health',
  'coding-bot':   'https://coding-bot.bot-fleet.workers.dev/health',
  'archi-bot':    'https://archi-bot.bot-fleet.workers.dev/health',
  'infra-bot':    'https://infra-bot.bot-fleet.workers.dev/health',
};

export const handleBotHealth = wrapRoute(async (request, env) => {
  const results = await Promise.allSettled(
    Object.entries(BOT_HEALTH_URLS).map(async ([botName, url]) => {
      const start = Date.now();
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': 'botfleet-status/1.0' },
        });
        const latencyMs = Date.now() - start;
        if (!res.ok) {
          return { bot: botName, status: 'error', latencyMs, httpStatus: res.status };
        }
        const body = await res.json().catch(() => null);
        return { bot: botName, status: 'online', latencyMs, data: body };
      } catch (err) {
        return { bot: botName, status: 'offline', latencyMs: Date.now() - start, error: err.message };
      }
    })
  );

  const bots = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { bot: 'unknown', status: 'error' }
  );

  const onlineCount = bots.filter((b) => b.status === 'online').length;
  const overallStatus =
    onlineCount === bots.length ? 'ok'
    : onlineCount > 0 ? 'degraded'
    : 'down';

  return jsonOk({
    status: overallStatus,
    summary: `${onlineCount}/${bots.length} bots reachable`,
    bots,
    timestamp: new Date().toISOString(),
  }, request);
});
