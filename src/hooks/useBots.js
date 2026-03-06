/**
 * useBots — fetches live bot status from /api/bots
 * Falls back to static data gracefully when API is unavailable.
 */
import { useState, useEffect } from 'react'
import { BOTS } from '../data/bots.js'

const POLL_INTERVAL = 30 * 1000 // 30s — live refresh for homepage hero

export function useBots() {
  const [bots, setBots] = useState(BOTS.map(b => ({ ...b, status: 'loading', currentIssues: [] })))
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  async function fetchBots() {
    try {
      const res = await fetch('/api/bots')
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()

      setBots(BOTS.map(bot => {
        const live = data.bots?.find(b => b.id === bot.id || b.githubUser === bot.githubUser)
        const currentIssues = live?.currentIssues ?? []
        return {
          ...bot,
          status: live?.status ?? 'offline',
          currentEpic: live?.currentEpic ?? null,
          currentIssues,
          currentIssue: currentIssues[0] ?? null,
        }
      }))
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
      setBots(prev => prev.map(b =>
        b.status === 'loading' ? { ...b, status: 'offline', currentIssues: [] } : b
      ))
    }
  }

  useEffect(() => {
    fetchBots()
    const timer = setInterval(fetchBots, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return { bots, error, lastUpdated, refetch: fetchBots }
}
