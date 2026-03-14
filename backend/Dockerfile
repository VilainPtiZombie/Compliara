FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
RUN npm ci

# ─────────────────────────────
# Développement
# ─────────────────────────────
FROM base AS development
COPY . .
EXPOSE 3000
CMD sh -c "npx prisma generate && npx prisma db push --accept-data-loss && npm run start:dev"

# ─────────────────────────────
# Build production
# ─────────────────────────────
FROM base AS build
COPY . .
RUN npx prisma generate
RUN npm run build

# ─────────────────────────────
# Production
# ─────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
