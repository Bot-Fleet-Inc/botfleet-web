/**
 * /api/bots       — fleet roster with status + current epic
 * /api/bots/:name — full bot profile with current issues
 */

import { fetchFleetRoster, fetchBotIssues } from '../lib/github.js';
import { cached, cacheInvalidate, CACHE_KEYS, TTL } from '../lib/cache.js';
import { jsonOk, jsonError, wrapRoute } from '../lib/cors.js';

/**
 * GET /api/bots
 * Returns the full fleet roster. Each entry includes:
 *   name, displayName, emoji, role, status, mission, currentIssues (summary)
 */
export const handleGetBots = wrapRoute(async (request, env) => {
  const token = env.GH_API_TOKEN;
  if (!token) return jsonError('GH_API_TOKEN not configured', 503, request);

  const { data: roster, fromCache, cachedAt } = await cached(
    env.CACHE,
    CACHE_KEYS.fleetRoster,
    () => fetchFleetRoster(token),
    TTL.roster,
  );

  // Fetch current issues per bot (shorter TTL, cached separately)
  const botsWithIssues = await Promise.all(
    roster.map(async (bot) => {
      if (!bot.githubUser) return { ...bot, currentIssues: [] };

      const { data: issues } = await cached(
        env.CACHE,
        CACHE_KEYS.botIssues(bot.name),
        () => fetchBotIssues(bot.githubUser, token),
        TTL.issues,
      );

      const currentIssue = issues.find((i) =>
        i.labels.some((l) => l.name === 'type:epic')
      ) ?? issues[0] ?? null;

      return {
        ...bot,
        currentIssues: issues.slice(0, 3),
        currentEpic: currentIssue,
      };
    })
  );

  return jsonOk(
    {
      bots: botsWithIssues,
      meta: { fromCache, cachedAt, count: botsWithIssues.length },
    },
    request,
  );
});

/**
 * GET /api/bots/:name
 * Returns full bot profile including all recent issues.
 */
export const handleGetBot = wrapRoute(async (request, env, _ctx, { name }) => {
  const token = env.GH_API_TOKEN;
  if (!token) return jsonError('GH_API_TOKEN not configured', 503, request);

  // Get roster to find the bot
  const { data: roster } = await cached(
    env.CACHE,
    CACHE_KEYS.fleetRoster,
    () => fetchFleetRoster(token),
    TTL.roster,
  );

  const bot = roster.find(
    (b) => b.name.toLowerCase() === name.toLowerCase()
  );
  if (!bot) {
    return jsonError(`Bot '${name}' not found`, 404, request);
  }

  // Get full issue list for this bot
  let issues = [];
  if (bot.githubUser) {
    const result = await cached(
      env.CACHE,
      CACHE_KEYS.botIssues(bot.name),
      () => fetchBotIssues(bot.githubUser, token),
      TTL.issues,
    );
    issues = result.data;
  }

  const currentEpic = issues.find((i) =>
    i.labels.some((l) => l.name === 'type:epic')
  ) ?? null;

  return jsonOk(
    {
      bot: {
        ...bot,
        issues,
        currentEpic,
      },
    },
    request,
  );
});
