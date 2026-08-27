#!/usr/bin/env bash
# Após criar/reactivar projeto no Neon, rode:
#   DATABASE_URL="postgresql://..." DATABASE_URL_UNPOOLED="postgresql://..." ./scripts/sync-neon-production.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/api"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Defina DATABASE_URL e DATABASE_URL_UNPOOLED (connection strings do Neon)"
  exit 1
fi

export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"

echo "==> Migrations..."
npx prisma migrate deploy

echo "==> Seed (ignorado se já houver usuários)..."
npm run db:seed || true

echo ""
echo "Pronto. Atualize no Vercel → Settings → Environment Variables:"
echo "  DATABASE_URL"
echo "  DATABASE_URL_UNPOOLED"
echo "Depois: Deployments → Redeploy"
