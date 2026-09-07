#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

if [ "$SEED_DEMO_USERS" != "false" ]; then
  echo "Seeding demo data (SEED_DEMO_USERS != false)..."
  npx tsx prisma/seed.ts || echo "Seed step failed or already applied — continuing."
else
  echo "SEED_DEMO_USERS=false — skipping seed."
fi

echo "Starting server..."
exec node server.js
