/**
 * Bot Fleet Web — Cloudflare Worker entry point.
 *
 * Routes:
 *   /api/bots                  → fleet roster
 *   /api/bots/:name            → single bot profile
 *   /api/epics                 → executive epics + timeline
 *   /api/activity              → activity feed (GET + POST webhook)
 *   /api/status                → combined fleet health (legacy)
 *   /api/status/github-rate    → GitHub rate limit
 *   /api/status/workers        → KV + D1 health
 *   /api/status/bots           → bot VM health
 *   /*                         → static assets (Vite build)
 */

import { handleGetBots, handleGetBot }                         from './routes/bots.js';
import { handleGetEpics }                                      from './routes/epics.js';
import { handleGetActivity, handlePostActivity }               from './routes/activity.js';
import { handleStatus, handleGitHubRate, handleWorkersHealth, handleBotHealth } from './routes/status.js';
import { handleOptions, jsonError }                            from './lib/cors.js';

export default {
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method.toUpperCase();

    // Handle CORS preflight for all API routes
    if (method === 'OPTIONS' && path.startsWith('/api/')) {
      return handleOptions(request);
    }

    // Route: GET /api/bots
    if (method === 'GET' && path === '/api/bots') {
      return handleGetBots(request, env, ctx, {});
    }

    // Route: GET /api/bots/:name
    const botMatch = path.match(/^\/api\/bots\/([^/]+)$/);
    if (method === 'GET' && botMatch) {
      return handleGetBot(request, env, ctx, { name: botMatch[1] });
    }

    // Route: GET /api/epics
    if (method === 'GET' && path === '/api/epics') {
      return handleGetEpics(request, env, ctx, {});
    }

    // Route: GET /api/activity
    if (method === 'GET' && path === '/api/activity') {
      return handleGetActivity(request, env, ctx, {});
    }

    // Route: POST /api/activity  (GitHub webhook receiver)
    if (method === 'POST' && path === '/api/activity') {
      return handlePostActivity(request, env, ctx, {});
    }

    // Route: GET /api/status (combined, legacy compat)
    if (method === 'GET' && path === '/api/status') {
      return handleStatus(request, env, ctx, {});
    }

    // Route: GET /api/status/github-rate
    if (method === 'GET' && path === '/api/status/github-rate') {
      return handleGitHubRate(request, env, ctx, {});
    }

    // Route: GET /api/status/workers
    if (method === 'GET' && path === '/api/status/workers') {
      return handleWorkersHealth(request, env, ctx, {});
    }

    // Route: GET /api/status/bots
    if (method === 'GET' && path === '/api/status/bots') {
      return handleBotHealth(request, env, ctx, {});
    }

    // 404 for unknown /api/* routes
    if (path.startsWith('/api/')) {
      return jsonError('Not found', 404, request);
    }

    // Fall through to static assets — strip edge cache for HTML
    const assetResponse = await env.ASSETS.fetch(request);
    const ct = assetResponse.headers.get('content-type') || '';
    if (ct.includes('text/html')) {
      const newHeaders = new Headers(assetResponse.headers);
      newHeaders.set('Cache-Control', 'no-store');
      return new Response(assetResponse.body, { status: assetResponse.status, headers: newHeaders });
    }
    return assetResponse;
  },
};
