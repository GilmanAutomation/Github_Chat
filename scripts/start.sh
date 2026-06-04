#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npx prisma db seed || echo "Seed already applied or skipped"

echo "🚀 Starting application..."
node server.js
