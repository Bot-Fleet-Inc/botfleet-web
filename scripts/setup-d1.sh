#!/usr/bin/env bash
# One-time D1 database setup script.
# Run once by dispatch-bot (infra) or manually:
#   CLOUDFLARE_ACCOUNT_ID=<id> CLOUDFLARE_API_TOKEN=<token> ./scripts/setup-d1.sh
#
# After running, update wrangler.toml [[d1_databases]].database_id with the output.

set -euo pipefail

echo "🗄️  Creating D1 database: botfleet-activity"
DB_OUTPUT=$(npx wrangler d1 create botfleet-activity 2>&1)
echo "$DB_OUTPUT"

DB_ID=$(echo "$DB_OUTPUT" | grep 'database_id' | grep -oE '[a-f0-9-]{36}' | head -1)

if [ -z "$DB_ID" ]; then
  echo "⚠️  Could not parse database_id — check output above and update wrangler.toml manually."
  exit 1
fi

echo ""
echo "✅ D1 database created: $DB_ID"
echo "   Patching wrangler.toml..."

sed -i "s/REPLACE_WITH_D1_DATABASE_ID/$DB_ID/" wrangler.toml
echo "   Done! Commit the updated wrangler.toml."

echo ""
echo "🔄 Running initial migration..."
npx wrangler d1 execute botfleet-activity --file=migrations/0001_activity.sql --remote
echo "   Migration complete."
