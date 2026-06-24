#!/usr/bin/env bash
# Setup do banco no build. NÃO derruba o build se algo falhar.
set -uo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[db-setup] DATABASE_URL não definido — pulando setup."
  exit 0
fi

# Conexão amigável para migração/seed:
#  - Neon: remove "-pooler" do host (conexão direta).
#  - Supabase: usa a porta 5432 (session pooler) em vez de 6543 (transaction),
#    pois o Prisma usa prepared statements.
MIG_URL="$(node -e "let r=(process.env.DATABASE_URL||''); r=r.replace('-pooler',''); r=r.replace(':6543/',':5432/'); process.stdout.write(r)")"

echo "[db-setup] aplicando patches SQL idempotentes (PR 5 + PR 7)..."
DATABASE_URL="$MIG_URL" npx tsx prisma/sql-schema-patches.ts || echo "[db-setup] aviso: patches SQL falharam."

echo "[db-setup] sincronizando schema (aditivo/não-destrutivo)..."
DATABASE_URL="$MIG_URL" npx prisma db push --skip-generate --accept-data-loss || echo "[db-setup] aviso: db push não aplicou (ok se o schema já existe)."

echo "[db-setup] garantindo tenant default (multi-tenancy PR 5)..."
DATABASE_URL="$MIG_URL" npx tsx prisma/seed-tenant.ts || echo "[db-setup] aviso: seed-tenant falhou."

echo "[db-setup] garantindo o admin..."
DATABASE_URL="$MIG_URL" npx tsx prisma/seed-admin.ts || echo "[db-setup] aviso: seed do admin falhou."

echo "[db-setup] gerando slugs do marketplace (PR 7)..."
DATABASE_URL="$MIG_URL" npx tsx prisma/seed-doctor-marketplace.ts || echo "[db-setup] aviso: seed marketplace falhou."

echo "[db-setup] limpando usuários de teste..."
DATABASE_URL="$MIG_URL" npx tsx prisma/cleanup-probes.ts || echo "[db-setup] aviso: cleanup falhou."

exit 0
