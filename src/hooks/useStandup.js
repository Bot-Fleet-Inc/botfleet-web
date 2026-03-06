/**
 * useStandup — standup timing + bot status derivation for WEB-9
 *
 * Standup fires every 5 minutes in sync with cron (every 5 min).
 * Phases:
 *   "idle"     → waiting for next standup
 *   "gathering" → 0–5s: bots animate toward center
 *   "standup"   → 5–35s: bots visible in standup circle
 *   "dispersing" → 35–50s: bots animate back to workstations
 */

import { useState, useEffect, useRef } from 'react'

/** Derive bot standup status from live API data */
function deriveStandupStatus(bot) {
  if (!bot) return 'unknown'
  const labels = (bot.currentIssues ?? []).flatMap((i) => i.labels ?? []).map((l) =>
    typeof l === 'string' ? l : l.name
  )
  if (labels.some((l) => l.includes('blocked'))) return 'blocked'
  if (bot.currentIssues?.length > 0) return 'active'
  if (bot.status === 'loading') return 'loading'
  return 'idle'
}

/** Milliseconds until the next 5-minute mark */
function msUntilNextStandup() {
  const now = Date.now()
  const ms = 5 * 60 * 1000
  return ms - (now % ms)
}

/** Compute current phase from ms offset into the standup cycle */
function computePhase(msIntoStandup) {
  if (msIntoStandup < 0)    return 'idle'
  if (msIntoStandup < 5000) return 'gathering'
  if (msIntoStandup < 35000) return 'standup'
  if (msIntoStandup < 50000) return 'dispersing'
  return 'idle'
}

/**
 * @param {Object[]} bots  — live bot data from useBots()
 * @returns {{ phase, countdownMs, standupBots, nextStandupAt }}
 */
export function useStandup(bots = []) {
  const [now, setNow] = useState(Date.now())
  const standupStartRef = useRef(null)

  // Tick every 500ms
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  // Detect standup triggers (5-min boundaries)
  useEffect(() => {
    const msUntil = msUntilNextStandup()
    const id = setTimeout(() => {
      standupStartRef.current = Date.now()
    }, msUntil)
    return () => clearTimeout(id)
  }, [now])

  const nextStandupAt = now + msUntilNextStandup()
  const countdownMs   = nextStandupAt - now

  // Phase calc
  let phase = 'idle'
  if (standupStartRef.current) {
    const elapsed = now - standupStartRef.current
    phase = computePhase(elapsed)
    if (phase === 'idle' && elapsed >= 50000) {
      // Standup cycle ended — clear ref so we wait for next trigger
      standupStartRef.current = null
    }
  }

  const standupBots = bots.map((bot) => ({
    ...bot,
    standupStatus: deriveStandupStatus(bot),
  }))

  return {
    phase,
    countdownMs,
    nextStandupAt,
    standupBots,
  }
}
