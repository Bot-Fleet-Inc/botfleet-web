/**
 * Workers KV cache helpers with configurable TTL.
 * Default TTL: 15 minutes (900 seconds).
 */

const DEFAULT_TTL_SECONDS = 1800; // 30 minutes

/**
 * Get a value from KV cache.
 * Returns the parsed value or null if missing/expired.
 */
export async function cacheGet(kv, key) {
  try {
    const raw = await kv.get(key, { type: 'json' });
    return raw ?? null;
  } catch {
    return null;
  }
}

/**
 * Set a value in KV cache with TTL.
 * Wraps value in an envelope with timestamp for diagnostics.
 */
export async function cacheSet(kv, key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const envelope = {
    data: value,
    cachedAt: new Date().toISOString(),
    ttl: ttlSeconds,
  };
  await kv.put(key, JSON.stringify(envelope), {
    expirationTtl: ttlSeconds,
  });
}

/**
 * Get raw envelope (data + cachedAt metadata).
 */
export async function cacheGetEnvelope(kv, key) {
  try {
    const raw = await kv.get(key, { type: 'text' });
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Cache-aside helper: return cached value or call fetcher and cache the result.
 *
 * @param {KVNamespace} kv
 * @param {string} key
 * @param {() => Promise<any>} fetcher
 * @param {number} [ttlSeconds]
 */
export async function cached(kv, key, fetcher, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const envelope = await cacheGetEnvelope(kv, key);
  if (envelope) {
    return { data: envelope.data, fromCache: true, cachedAt: envelope.cachedAt };
  }

  const data = await fetcher();
  await cacheSet(kv, key, data, ttlSeconds);
  return { data, fromCache: false, cachedAt: new Date().toISOString() };
}

/**
 * Invalidate (delete) a cache key.
 */
export async function cacheInvalidate(kv, key) {
  await kv.delete(key);
}

export const CACHE_KEYS = {
  fleetRoster:   'fleet:roster',
  epics:         'fleet:epics',
  botProfile:    (name) => `bot:profile:${name}`,
  botIssues:     (name) => `bot:issues:${name}`,
};

export const TTL = {
  roster:  3600, // 60 min
  epics:   3600, // 60 min
  profile: 1800, // 30 min
  issues:  600,  // 10 min
};
