/**
 * Status API endpoints — WEB-7
 *
 * GET /api/status              — combined fleet health (legacy compat)
 * GET /api/status/github-rate  — GitHub API rate limit
 * GET /api/status/workers      — Cloudflare Workers health (KV + D1)
 * GET /api/status/bots         — Bot fleet health (VM heartbeat ping)
 */

import { jsonOk, jsonError, wrapRoute } from '../lib/cors.js';

// ─── Bot registry ─────────────────────────────────────────────────────────────

const BOT_REGISTRY = [
  { name: 'dispatch-bot', displayName: 'Dispatch', githubUser: 'botfleet-dispatch' },
  { name: 'design-bot',   displayName: 'Design',   githubUser: 'botfleet-design'   },
  { name: 'coding-bot',   displayName: 'Coding',   githubUser: 'botfleet-coding'   },
  { name: 'archi-bot',    displayName: 'Archi',    githubUser: 'botfleet-archi'    },
  { name: 'infra-bot',    displayName: 'Infra',    githubUser: 'botfleet-infra'    },
];

const BOT_HEALTH_URLS = {
  'dispatch-bot': 'https://dispatch-bot.bot-fleet.workers.dev/health',
  'design-bot':   'https://design-bot.bot-fleet.workers.dev/health',
  'coding-bot':   'https://coding-bot.bot-fleet.workers.dev/health',
  'archi-bot':    'https://archi-bot.bot-fleet.workers.dev/health',
  'infra-bot':    'https://infra-bot.bot-fleet.workers.dev/health',
};

// ─── GET /api/status (combined, legacy compat) ────────────────────────────────

export const handleStatus = wrapRoute(async (request, env) => {
  const [ghResult, botsResult] = await Promise.allSettled([
    checkGitHubBasic(env),
    checkBotsFromDB(env),
  ]);

  const github  = ghResult.status  === 'fulfilled' ? ghResult.value  : { reachable: false, error: ghResult.reason?.message };
  const bots    = botsResult.status === 'fulfilled' ? botsResult.value : [];
  const workers = {
    healthy: true,
    detail: 'botfleet-web Worker responding',
  };

  return jsonOk({ bots, github, workers, ts: new Date().toISOString() }, request);
});

// ─── GET /api/status/github-rate ─────────────────────────────────────────────

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
        limit:     rate.limit,
        remaining: rate.remaining,
        reset:     rate.reset,
        resetIn:   Math.max(0, rate.reset - Math.floor(Date.now() / 1000)),
        percent:   Math.round((rate.remaining / rate.limit) * 100),
      },
      graphql: resources?.graphql ?? null,
      status: rate.remaining > 100 ? 'ok' : rate.remaining > 10 ? 'warn' : 'critical',
    }, request);
  } catch (err) {
    return jsonError(`Failed to fetch rate limit: ${err.message}`, 502, request);
  }
});

// ─── GET /api/status/workers ─────────────────────────────────────────────────

export const handleWorkersHealth = wrapRoute(async (request, env) => {
  const startMs = Date.now();

  const kvResults = await Promise.allSettled([
    env.CACHE    ? env.CACHE.get('__health_check__').then(() => true)    : Promise.reject(new Error('CACHE binding missing')),
    env.ACTIVITY ? env.ACTIVITY.get('__health_check__').then(() => true) : Promise.reject(new Error('ACTIVITY binding missing')),
  ]);

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

  const latencyMs  = Date.now() - startMs;
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

// ─── GET /api/status/bots ────────────────────────────────────────────────────

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

  const onlineCount  = bots.filter((b) => b.status === 'online').length;
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

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function checkGitHubBasic(env) {
  const token = env.GH_API_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://api.github.com/rate_limit', {
      headers: { ...headers, 'User-Agent': 'botfleet-web/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { reachable: true, rateLimit: null };
    const data = await res.json();
    const core = data.resources?.core ?? {};
    return {
      reachable: true,
      rateLimit: { limit: core.limit, remaining: core.remaining, reset: core.reset, used: core.used },
    };
  } catch {
    return { reachable: false, rateLimit: null };
  }
}

async function checkBotsFromDB(env) {
  if (!env.DB) {
    return BOT_REGISTRY.map((b) => ({ ...b, status: 'unknown', detail: 'D1 not available' }));
  }
  try {
    const results = await env.DB.prepare(`
      SELECT actor, MAX(created_at) as last_seen
      FROM activity_posts
      GROUP BY actor
    `).all();

    const actorMap = {};
    for (const row of (results.results ?? [])) {
      actorMap[row.actor] = row.last_seen;
    }

    return BOT_REGISTRY.map((b) => {
      const lastSeen = actorMap[b.displayName] ?? actorMap[`🟧 ${b.displayName}`] ?? null;
      let status = 'unknown';
      if (lastSeen) {
        const age = Date.now() - new Date(lastSeen).getTime();
        status = age < 4 * 3_600_000 ? 'ok' : 'unknown';
      }
      return {
        ...b,
        status,
        lastHeartbeat: lastSeen,
        detail: lastSeen
          ? `Last active: ${new Date(lastSeen).toLocaleString('en-GB')}`
          : 'No recent activity in feed',
      };
    });
  } catch {
    return BOT_REGISTRY.map((b) => ({ ...b, status: 'unknown', detail: 'DB query failed' }));
  }
}
