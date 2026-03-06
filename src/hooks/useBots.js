/**
 * useBots — fetches live bot status from /api/bots
 * Falls back to static data gracefully when API is unavailable.
 */
import { useState, useEffect } from 'react'
import { BOTS } from '../data/bots.js'

const POLL_INTERVAL = 5 * 60 * 1000 // 5 min — synced with standup cron

export function useBots() {
  const [bots, setBots] = useState(BOTS.map(b => ({ ...b, status: 'loading' })))
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  async function fetchBots() {
    try {
      const res = await fetch('/api/bots')
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()

      setBots(BOTS.map(bot => {
        const live = data.bots?.find(b => b.id === bot.id || b.githubUser === bot.githubUser)
        return {
          ...bot,
          status: live?.status ?? 'offline',
          currentEpic: live?.currentEpic ?? null,
          currentIssue: live?.currentIssue ?? null,
        }
      }))
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
      // Keep previous data, just mark status unknown
      setBots(prev => prev.map(b => b.status === 'loading' ? { ...b, status: 'offline' } : b))
    }
  }

  useEffect(() => {
    fetchBots()
    const timer = setInterval(fetchBots, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return { bots, error, lastUpdated, refetch: fetchBots }
}
