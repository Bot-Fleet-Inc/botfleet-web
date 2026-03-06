import { useState, useEffect, useCallback } from 'react';

const REFRESH_INTERVAL = 60_000; // 60 seconds

/** Fetch GitHub rate limit */
async function fetchGitHubRateLimit() {
  const res = await fetch('/api/status/github-rate', { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Fetch Cloudflare Workers health via /api/status/workers */
async function fetchWorkersHealth() {
  const res = await fetch('/api/status/workers', { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Fetch fleet bot health via /api/status/bots */
async function fetchBotHealth() {
  const res = await fetch('/api/status/bots', { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Composite status hook — aggregates all status checks.
 * Polls every 60s.
 */
export function useStatus() {
  const [data, setData] = useState({
    github: null,
    workers: null,
    bots: null,
    lastUpdated: null,
    loading: true,
    errors: {},
  });

  const refresh = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true }));

    const [github, workers, bots] = await Promise.allSettled([
      fetchGitHubRateLimit(),
      fetchWorkersHealth(),
      fetchBotHealth(),
    ]);

    const errors = {};
    if (github.status === 'rejected')  errors.github  = github.reason?.message;
    if (workers.status === 'rejected') errors.workers = workers.reason?.message;
    if (bots.status === 'rejected')    errors.bots    = bots.reason?.message;

    setData({
      github:  github.status  === 'fulfilled' ? github.value  : null,
      workers: workers.status === 'fulfilled' ? workers.value : null,
      bots:    bots.status    === 'fulfilled' ? bots.value    : null,
      lastUpdated: new Date().toISOString(),
      loading: false,
      errors,
    });
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  return { ...data, refresh };
}
