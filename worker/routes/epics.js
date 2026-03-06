/**
 * /api/epics — all executive epics with timeline data
 */

import { fetchEpics } from '../lib/github.js';
import { cached, CACHE_KEYS, TTL } from '../lib/cache.js';
import { jsonOk, jsonError, wrapRoute } from '../lib/cors.js';

/**
 * GET /api/epics
 * Returns all executive board epics from bot-fleet-continuum,
 * labelled type:epic. Includes open + recently closed.
 *
 * Query params:
 *   ?state=open|closed|all   (default: all)
 *   ?label=<name>            (optional filter by label name)
 */
export const handleGetEpics = wrapRoute(async (request, env) => {
  const token = env.GH_API_TOKEN;
  if (!token) return jsonError('GH_API_TOKEN not configured', 503, request);

  const url = new URL(request.url);
  const stateFilter = url.searchParams.get('state') ?? 'all';
  const labelFilter = url.searchParams.get('label') ?? null;

  const { data: epics, fromCache, cachedAt } = await cached(
    env.CACHE,
    CACHE_KEYS.epics,
    () => fetchEpics(token),
    TTL.epics,
  );

  let filtered = epics;

  if (stateFilter === 'open') {
    filtered = filtered.filter((e) => e.state === 'OPEN');
  } else if (stateFilter === 'closed') {
    filtered = filtered.filter((e) => e.state === 'CLOSED');
  }

  if (labelFilter) {
    filtered = filtered.filter((e) =>
      e.labels.some((l) => l.name.toLowerCase() === labelFilter.toLowerCase())
    );
  }

  // Build timeline: group by month
  const timeline = buildTimeline(filtered);

  return jsonOk(
    {
      epics: filtered,
      timeline,
      meta: {
        fromCache,
        cachedAt,
        total: filtered.length,
        open: filtered.filter((e) => e.state === 'OPEN').length,
        closed: filtered.filter((e) => e.state === 'CLOSED').length,
      },
    },
    request,
  );
});

/**
 * Build a simple timeline grouped by creation month.
 */
function buildTimeline(epics) {
  const months = {};
  for (const epic of epics) {
    const month = epic.createdAt.slice(0, 7); // YYYY-MM
    if (!months[month]) months[month] = { month, open: 0, closed: 0, epics: [] };
    if (epic.state === 'OPEN') months[month].open++;
    else months[month].closed++;
    months[month].epics.push({ number: epic.number, title: epic.title, state: epic.state });
  }
  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
}
