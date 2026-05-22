#!/usr/bin/env bash
# Setup do banco no build. NÃO derruba o build se o banco não estiver pronto —
# assim o app sobe e basta configurar um DATABASE_URL válido + redeploy.
set -uo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[db-setup] DATABASE_URL não definido — pulando setup (configure um DATABASE_URL válido no Netlify)."
  exit 0
fi

# Para Neon: migrações precisam da conexão DIRETA (sem -pooler). Para outros
# provedores (ex.: Supabase), o replace não tem efeito e usa a URL como está.
DIRECT_URL="$(node -e "process.stdout.write((process.env.DATABASE_URL||'').replace('-pooler',''))")"

echo "[db-setup] aplicando schema (prisma db push)..."
if DATABASE_URL="$DIRECT_URL" npx prisma db push --skip-generate --accept-data-loss; then
  echo "[db-setup] schema ok — criando/atualizando admin..."
  DATABASE_URL="$DIRECT_URL" npx tsx prisma/seed-admin.ts || echo "[db-setup] AVISO: seed do admin falhou (segue o build)."
else
  echo "[db-setup] AVISO: db push falhou (DATABASE_URL inacessível?). O app vai subir; configure um DATABASE_URL válido e refaça o deploy."
fi

exit 0
