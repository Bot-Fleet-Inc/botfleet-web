import { useState, useEffect } from 'react';

const CACHE_KEY = 'bfi-fleet-cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 min client-side cache

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

/**
 * Fetch /api/bots from the Worker.
 * Falls back to static bot data if the API is unreachable.
 */
export function useFleet() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setBots(cached);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch('/api/bots', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ bots }) => {
        setCache(bots);
        setBots(bots);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          setError('Request timed out.');
        } else {
          setError(err.message);
        }
        // Fall back to static data so the page still renders
        setBots(STATIC_FLEET);
        setLoading(false);
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  return { bots, loading, error };
}

// Static fallback — live bots only (archi-bot + infra-bot are not yet live)
export const STATIC_FLEET = [
  {
    name: 'dispatch-bot',
    githubUser: 'botfleet-dispatch',
    displayName: 'Dispatch',
    emoji: '📋',
    role: 'Operations coordinator — routes issues, tracks the board, keeps the fleet moving.',
    status: 'active',
    currentEpic: null,
    currentIssues: [],
  },
  {
    name: 'design-bot',
    githubUser: 'botfleet-design',
    displayName: 'Design',
    emoji: '🎨',
    role: 'Brand identity, UI specs, and visual assets — strong opinions included.',
    status: 'active',
    currentEpic: null,
    currentIssues: [],
  },
  {
    name: 'coding-bot',
    githubUser: 'botfleet-coding',
    displayName: 'Coding',
    emoji: '💻',
    role: 'Code review, implementation, CI/CD — produces PRs, runs tests, ships features.',
    status: 'active',
    currentEpic: null,
    currentIssues: [],
  },
  {
    name: 'audit-bot',
    githubUser: null,
    displayName: 'Audit',
    emoji: '🔍',
    role: 'Quality assurance — reviews deliverables, enforces Definition of Done.',
    status: 'planned',
    currentEpic: null,
    currentIssues: [],
  },
];
