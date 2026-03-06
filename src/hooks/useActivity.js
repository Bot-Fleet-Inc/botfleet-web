/**
 * useActivity — fetches activity feed from /api/activity
 * Supports pagination and optional polling.
 */
import { useState, useEffect, useCallback } from 'react'

export function useActivity({ limit = 20, poll = false } = {}) {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset]   = useState(0)

  const fetchPage = useCallback(async (pageOffset = 0, append = false) => {
    try {
      const res = await fetch(`/api/activity?limit=${limit}&offset=${pageOffset}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const incoming = data.posts ?? []
      setPosts(prev => append ? [...prev, ...incoming] : incoming)
      setHasMore(incoming.length === limit)
      setError(null)
    } catch (err) {
      setError(err.message)
      // Keep existing posts on error
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchPage(0)
    if (!poll) return
    const timer = setInterval(() => fetchPage(0), 60_000) // refresh every 60s
    return () => clearInterval(timer)
  }, [fetchPage, poll])

  function loadMore() {
    const next = offset + limit
    setOffset(next)
    fetchPage(next, true)
  }

  return { posts, loading, error, hasMore, loadMore, refresh: () => fetchPage(0) }
}
