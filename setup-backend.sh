#!/bin/bash
# WiseDrops Backend Setup Script
# Run this from the project root: bash setup-backend.sh

set -e

export PATH="$HOME/nodejs/node-v20.11.1-darwin-x64/bin:$PATH"

echo "=== WiseDrops Backend Setup ==="
echo ""

# STEP 1: Install Homebrew if not present
if ! command -v brew &> /dev/null; then
  echo "[1/7] Installing Homebrew..."
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Add brew to PATH for this session
  if [ -f /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  elif [ -f /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
else
  echo "[1/7] Homebrew already installed"
fi

# STEP 2: Install PostgreSQL and Redis
echo "[2/7] Installing PostgreSQL 16 and Redis..."
brew install postgresql@16 redis

echo "[3/7] Starting PostgreSQL and Redis services..."
brew services start postgresql@16
brew services start redis

# Wait for PostgreSQL to be ready
echo "  Waiting for PostgreSQL to start..."
sleep 3

# Make sure psql is in PATH
export PATH="$(brew --prefix postgresql@16)/bin:$PATH"

# STEP 3: Create the database
echo "[4/7] Creating wisedrops database..."
createdb wisedrops 2>/dev/null || echo "  Database 'wisedrops' may already exist, continuing..."

# Enable extensions
echo "  Enabling PostgreSQL extensions..."
psql wisedrops -c "CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS pg_trgm;" 2>/dev/null || echo "  Extensions may already exist, continuing..."

# STEP 4: .env already created by Claude
echo "[5/7] .env file already exists"

# STEP 5: Generate Prisma client and push schema
echo "[6/7] Running Prisma generate and db push..."
cd /Users/biancadacosta/Documents/wisedrops
npx prisma generate
npx prisma db push

# STEP 6: Seed the database
echo "[7/7] Seeding the database..."
npx tsx prisma/seed.ts

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Services running:"
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo ""
echo "Test accounts:"
echo "  Patient: maria@teste.com"
echo "  Doctors: dr.carlos@wisedrops.com.br, dra.ana@wisedrops.com.br, dr.felipe@wisedrops.com.br"
echo "  Admin: admin@wisedrops.com.br"
echo "  All passwords: senha123 (dev placeholder hash)"
echo ""
echo "To start the app:"
echo "  export PATH=\"\$HOME/nodejs/node-v20.11.1-darwin-x64/bin:\$PATH\""
echo "  npm run dev"
