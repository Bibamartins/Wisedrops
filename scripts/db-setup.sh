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

echo "[db-setup] sincronizando schema (aditivo/não-destrutivo)..."
DATABASE_URL="$MIG_URL" npx prisma db push --skip-generate || echo "[db-setup] aviso: db push não aplicou (ok se o schema já existe)."

echo "[db-setup] garantindo o admin..."
DATABASE_URL="$MIG_URL" npx tsx prisma/seed-admin.ts || echo "[db-setup] aviso: seed do admin falhou."

echo "[db-setup] limpando usuários de teste..."
DATABASE_URL="$MIG_URL" npx tsx prisma/cleanup-probes.ts || echo "[db-setup] aviso: cleanup falhou."

exit 0
