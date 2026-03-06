/**
 * GET /api/status — fleet health, GitHub rate limit, CF Workers health
 * WEB-7
 */
import { jsonOk, jsonError, wrapRoute } from '../lib/cors.js'

// Bot fleet — VM IPs from IDENTITY.md files
// dispatch-bot aggregates health; here we do a basic probe
const BOT_REGISTRY = [
  { name: 'dispatch-bot', displayName: 'Dispatch', githubUser: 'botfleet-dispatch' },
  { name: 'design-bot',   displayName: 'Design',   githubUser: 'botfleet-design'   },
  { name: 'coding-bot',   displayName: 'Coding',   githubUser: 'botfleet-coding'   },
  { name: 'archi-bot',    displayName: 'Archi',    githubUser: 'botfleet-archi'    },
  { name: 'infra-bot',    displayName: 'Infra',    githubUser: 'botfleet-infra'    },
]

export const handleStatus = wrapRoute(async (request, env) => {
  const [ghResult, botsResult] = await Promise.allSettled([
    checkGitHub(env),
    checkBots(env),
  ])

  const github  = ghResult.status  === 'fulfilled' ? ghResult.value  : { reachable: false, error: ghResult.reason?.message }
  const bots    = botsResult.status === 'fulfilled' ? botsResult.value : []

  const workers = {
    healthy: true, // If this endpoint responds, the Worker is healthy
    detail: 'botfleet-web Worker responding',
  }

  return jsonOk({ bots, github, workers, ts: new Date().toISOString() }, request)
})

async function checkGitHub(env) {
  const token = env.GH_API_TOKEN
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch('https://api.github.com/rate_limit', {
      headers: { ...headers, 'User-Agent': 'botfleet-web/1.0' },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return { reachable: true, rateLimit: null }

    const data = await res.json()
    const core = data.resources?.core ?? {}

    return {
      reachable: true,
      rateLimit: {
        limit:     core.limit,
        remaining: core.remaining,
        reset:     core.reset,
        used:      core.used,
      },
    }
  } catch {
    return { reachable: false, rateLimit: null }
  }
}

async function checkBots(env) {
  // If DB is available, check last activity per bot from activity_posts
  // as a proxy for "bot was recently active"
  if (!env.DB) {
    return BOT_REGISTRY.map(b => ({ ...b, status: 'unknown', detail: 'D1 not available' }))
  }

  try {
    const results = await env.DB.prepare(`
      SELECT actor, MAX(created_at) as last_seen
      FROM activity_posts
      GROUP BY actor
    `).all()

    const actorMap = {}
    for (const row of (results.results ?? [])) {
      actorMap[row.actor] = row.last_seen
    }

    return BOT_REGISTRY.map(b => {
      // Match on display name or github user
      const lastSeen = actorMap[b.displayName] ?? actorMap[`🟧 ${b.displayName}`] ?? null
      let status = 'unknown'
      if (lastSeen) {
        const age = Date.now() - new Date(lastSeen).getTime()
        status = age < 30 * 60_000 ? 'ok' : age < 4 * 3_600_000 ? 'ok' : 'unknown'
      }
      return {
        ...b,
        status,
        lastHeartbeat: lastSeen,
        detail: lastSeen ? `Last active: ${new Date(lastSeen).toLocaleString('en-GB')}` : 'No recent activity in feed',
      }
    })
  } catch {
    return BOT_REGISTRY.map(b => ({ ...b, status: 'unknown', detail: 'DB query failed' }))
  }
}
