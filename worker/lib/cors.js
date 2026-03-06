/**
 * CORS and JSON response helpers for Worker API routes.
 */

const ALLOWED_ORIGINS = [
  'https://botfleet-web.pages.dev',
  'https://botfleet.workers.dev',
  // Allow all *.botfleet-web.pages.dev preview URLs
];

/**
 * Build CORS headers for a given origin.
 */
export function corsHeaders(origin) {
  const allowed =
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.botfleet-web.pages.dev') ||
    origin.endsWith('.workers.dev') ||
    // Allow localhost for local dev
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:');

  return {
    'Access-Control-Allow-Origin': allowed ? (origin ?? '*') : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Hub-Signature-256',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle preflight OPTIONS requests.
 */
export function handleOptions(request) {
  const origin = request.headers.get('Origin') ?? '';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/**
 * JSON success response.
 */
export function jsonOk(data, request, extra = {}) {
  const origin = request?.headers.get('Origin') ?? '';
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      ...corsHeaders(origin),
      ...extra,
    },
  });
}

/**
 * JSON error response.
 */
export function jsonError(message, status = 500, request = null) {
  const origin = request?.headers.get('Origin') ?? '';
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

/**
 * Wrap a route handler with error catching.
 */
export function wrapRoute(handler) {
  return async (request, env, ctx, params) => {
    try {
      return await handler(request, env, ctx, params);
    } catch (err) {
      console.error('[Worker]', err);
      return jsonError('Internal server error', 500, request);
    }
  };
}
