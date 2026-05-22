#!/usr/bin/env bash
set -euo pipefail

# O Netlify injeta NETLIFY_DATABASE_URL (Neon, conexão "pooled").
# Migrações do Prisma (db push) precisam da conexão DIRETA (não-pooled).
# Derivamos a direta removendo "-pooler" do host.
DIRECT_URL="$(node -e "process.stdout.write((process.env.NETLIFY_DATABASE_URL||'').replace('-pooler',''))")"

if [ -z "$DIRECT_URL" ]; then
  echo "[db-setup] ERRO: NETLIFY_DATABASE_URL vazio — banco não injetado."
  exit 1
fi

echo "[db-setup] aplicando schema no banco (db push, conexão direta)..."
NETLIFY_DATABASE_URL="$DIRECT_URL" npx prisma db push --skip-generate --accept-data-loss

echo "[db-setup] criando/atualizando admin..."
NETLIFY_DATABASE_URL="$DIRECT_URL" npx tsx prisma/seed-admin.ts

echo "[db-setup] concluído."
