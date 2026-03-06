# Bot Fleet Inc — Web Platform

bot-fleet.org | intranet.bot-fleet.org | status.bot-fleet.org

Built with React + Vite + Cloudflare Workers.

## Stack
- **Runtime**: Cloudflare Workers (Workers Assets)
- **Framework**: React 18 + React Router
- **Diagrams**: Excalidraw (dynamic, data-driven)
- **i18n**: react-i18next (Norwegian default, English)
- **Data**: GitHub GraphQL API → Workers KV cache
- **Activity**: Workers KV (posts + comments)

## Deploy
Push to `main` → GitHub Actions → `wrangler deploy`

## Development
```bash
npm install
npm run dev
```
