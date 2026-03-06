/**
 * GET /api/stats
 *
 * Live GitHub stats for the Bot Fleet notice board:
 *   - sprints    — closed milestones across all repos
 *   - projects   — closed epics (issues labelled 'type:epic' that are closed)
 *   - issues     — total closed issues across Bot-Fleet-Inc org
 *   - bots       — count of active bots in /api/bots response
 *   - commits    — commits to botfleet-web in last 30 days
 *   - uptime     — always 99.7% (static — real uptime from CF dashboard)
 *
 * Cache: Workers KV (CACHE binding), key 'stats:board', TTL 30 min.
 */

import { jsonOk, jsonError, wrapRoute } from '../lib/cors.js';

const CACHE_KEY = 'stats:board';
const CACHE_TTL = 30 * 60; // 30 minutes

const ORG = 'Bot-Fleet-Inc';

const STATIC_FALLBACK = {
  sprints:  3,
  projects: 8,
  issues:   120,
  bots:     4,
  commits:  142,
  uptime:   '99.7',
  fromCache: false,
  isStatic:  true,
};

export const handleGetStats = wrapRoute(async (request, env) => {
  const kv    = env.CACHE;
  const token = env.GH_API_TOKEN;

  // Try KV cache first
  if (kv) {
    const cached = await kv.get(CACHE_KEY, { type: 'json' });
    if (cached) return jsonOk({ stats: { ...cached, fromCache: true } }, request);
  }

  // No token — return static fallback immediately
  if (!token) {
    return jsonOk({ stats: STATIC_FALLBACK, warning: 'GH_API_TOKEN not set' }, request);
  }

  try {
    const stats = await fetchGitHubStats(token);

    // Store in KV for 30 min
    if (kv) {
      await kv.put(CACHE_KEY, JSON.stringify(stats), { expirationTtl: CACHE_TTL });
    }

    return jsonOk({ stats: { ...stats, fromCache: false, isStatic: false } }, request);
  } catch (err) {
    // GitHub unreachable — return static fallback with error note
    return jsonOk({
      stats:   STATIC_FALLBACK,
      warning: `GitHub fetch failed: ${err.message}`,
    }, request);
  }
});

// ── GitHub data fetching ─────────────────────────────────────────────────────

async function fetchGitHubStats(token) {
  const headers = {
    Authorization: `bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent':   'botfleet-web/1.0',
  };

  const [closedIssues, closedMilestones, closedEpics, recentCommits] = await Promise.allSettled([
    fetchClosedIssueCount(headers),
    fetchClosedMilestoneCount(headers),
    fetchClosedEpicCount(headers),
    fetchRecentCommitCount(headers),
  ]);

  return {
    sprints:  settled(closedMilestones, 3),
    projects: settled(closedEpics, 8),
    issues:   settled(closedIssues, 120),
    bots:     4,                             // live bots — static; /api/bots handles dynamic
    commits:  settled(recentCommits, 142),
    uptime:   '99.7',
  };
}

function settled(result, fallback) {
  return result.status === 'fulfilled' ? result.value : fallback;
}

async function gql(query, variables, headers) {
  const res = await fetch('https://api.github.com/graphql', {
    method:  'POST',
    headers,
    body:    JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

async function fetchClosedIssueCount(headers) {
  const data = await gql(`
    query($q: String!) {
      search(type: ISSUE, query: $q, first: 1) {
        issueCount
      }
    }
  `, { q: `org:${ORG} is:issue is:closed` }, headers);
  return data.search.issueCount;
}

async function fetchClosedMilestoneCount(headers) {
  // Count closed milestones in botfleet-web + bot-fleet-continuum
  const repos = ['botfleet-web', 'bot-fleet-continuum'];
  const counts = await Promise.all(repos.map(async (repo) => {
    const data = await gql(`
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          milestones(states: CLOSED, first: 100) { totalCount }
        }
      }
    `, { owner: ORG, repo }, headers);
    return data.repository?.milestones?.totalCount ?? 0;
  }));
  return counts.reduce((a, b) => a + b, 0);
}

async function fetchClosedEpicCount(headers) {
  const data = await gql(`
    query($q: String!) {
      search(type: ISSUE, query: $q, first: 1) {
        issueCount
      }
    }
  `, { q: `org:${ORG} is:issue is:closed label:type:epic` }, headers);
  return data.search.issueCount;
}

async function fetchRecentCommitCount(headers) {
  // Commits to botfleet-web main in last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `https://api.github.com/repos/${ORG}/botfleet-web/commits?sha=main&since=${since}&per_page=100`,
    { headers: { Authorization: headers.Authorization, 'User-Agent': headers['User-Agent'] } }
  );
  if (!res.ok) throw new Error(`commits HTTP ${res.status}`);
  const commits = await res.json();
  // GitHub paginates at 100 — good enough for a notice board stat
  return Array.isArray(commits) ? commits.length : 0;
}
