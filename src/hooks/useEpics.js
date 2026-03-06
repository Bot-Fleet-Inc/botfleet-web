/**
 * useEpics — fetches executive board epics from /api/epics
 */
import { useState, useEffect } from 'react'

const CACHE_KEY = 'bfi-epics-cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 min

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function setCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* ignore */ }
}

export function useEpics({ state = 'all', label } = {}) {
  const [epics, setEpics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cached = getCached()
    if (cached) {
      setEpics(cached)
      setLoading(false)
      return
    }

    const params = new URLSearchParams()
    if (state && state !== 'all') params.set('state', state)
    if (label) params.set('label', label)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    fetch(`/api/epics?${params}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(({ epics }) => {
        setCache(epics)
        setEpics(epics ?? [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.name === 'AbortError' ? 'Timeout' : err.message)
        setEpics(STATIC_EPICS)
        setLoading(false)
      })
      .finally(() => clearTimeout(timeout))

    return () => { controller.abort(); clearTimeout(timeout) }
  }, [state, label])

  return { epics, loading, error }
}

// Static fallback so the page renders even without API
export const STATIC_EPICS = [
  {
    number: 6,
    title: '[Epic] Bot Fleet Inc Web Platform — bot-fleet.org + subdomains',
    state: 'open',
    labels: ['type:epic', 'priority:high', 'env:dev'],
    createdAt: '2026-03-06T00:00:00Z',
    url: 'https://github.com/Bot-Fleet-Inc/bot-fleet-continuum/issues/6',
    linkedBots: ['dispatch-bot', 'design-bot', 'coding-bot'],
  },
]
