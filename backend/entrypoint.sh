#!/bin/sh
set -e

echo "⏳ Génération du client Prisma..."
npx prisma generate

echo "⏳ Application des migrations..."
npx prisma migrate deploy

echo "✅ Démarrage du backend..."
exec npm run start:dev
