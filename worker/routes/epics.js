/**
 * /api/epics — all executive epics with Kanban board status
 *
 * WEB-11: Enhanced to support wall Kanban board in HQ room.
 * Fetches project board status (Planned/In Progress/Blocked/Done)
 * via GitHub Projects GraphQL (PVT_kwDOD8mCJs4BQ1x1), with fallback
 * to label-based status detection.
 */

import { fetchEpics, fetchEpicsWithBoardStatus } from '../lib/github.js';
import { cached, cacheGetEnvelope, cacheSet, CACHE_KEYS, TTL } from '../lib/cache.js';
import { jsonOk, jsonError, wrapRoute } from '../lib/cors.js';

const BOARD_CACHE_KEY = 'epics:board:cache';
const BOARD_CACHE_TTL = 60; // 60 seconds for live board

/**
 * GET /api/epics
 * Returns all executive board epics from bot-fleet-continuum,
 * labelled type:epic. Includes open + recently closed.
 *
 * Query params:
 *   ?state=open|closed|all   (default: all)
 *   ?label=<name>            (optional filter by label name)
 *   ?board=true              (include Kanban board status + 60s cache)
 */
export const handleGetEpics = wrapRoute(async (request, env) => {
  const token = env.GH_API_TOKEN || env.GITHUB_TOKEN;
  const url = new URL(request.url);
  const boardMode = url.searchParams.get('board') === 'true';

  if (boardMode) {
    return handleBoardEpics(request, env, token);
  }

  if (!token) return jsonError('GH_API_TOKEN not configured', 503, request);

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
 * Handle board=true mode: return epics with Kanban status for WallKanban.
 * Tries project board GraphQL first, falls back to label-based status.
 * Cache TTL: 60 seconds.
 */
async function handleBoardEpics(request, env, token) {
  const kv = env.CACHE;

  // Try KV cache first (short TTL for live board)
  if (kv) {
    const envelope = await cacheGetEnvelope(kv, BOARD_CACHE_KEY);
    if (envelope) {
      return jsonOk({ epics: envelope.data, fromCache: true, cachedAt: envelope.cachedAt }, request);
    }
  }

  // No token — return empty with warning
  if (!token) {
    return jsonOk({
      epics: [],
      fromCache: false,
      warning: 'GitHub token not configured',
    }, request);
  }

  let epics = [];
  let source = 'graphql';

  try {
    epics = await fetchEpicsWithBoardStatus(token);
  } catch (err) {
    // Fallback: use existing epics endpoint + derive status from labels
    source = 'rest-fallback';
    try {
      const rawEpics = await fetchEpics(token);
      epics = rawEpics
        .filter((e) => e.state === 'OPEN')
        .map((e) => ({
          ...e,
          status: deriveLabelStatus(e.labels),
        }));
    } catch (fallbackErr) {
      return jsonOk({
        epics: [],
        fromCache: false,
        warning: `Fetch failed: ${fallbackErr.message}`,
      }, request);
    }
  }

  // Cache in KV for 60s
  if (kv) {
    await cacheSet(kv, BOARD_CACHE_KEY, epics, BOARD_CACHE_TTL);
  }

  return jsonOk({ epics, fromCache: false, source }, request);
}

/**
 * Derive Kanban status from issue labels.
 */
function deriveLabelStatus(labels) {
  const names = labels.map((l) => l.name.toLowerCase());
  if (names.includes('status:blocked')) return 'Blocked';
  if (names.includes('status:in-progress') || names.includes('status:in progress')) return 'In Progress';
  if (names.includes('status:done') || names.includes('status:closed')) return 'Done';
  if (names.includes('status:planned')) return 'Planned';
  return 'Planned';
}

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
