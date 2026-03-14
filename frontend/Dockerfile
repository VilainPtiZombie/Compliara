FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ─────────────────────────────
# Développement
# ─────────────────────────────
FROM base AS development
COPY . .
EXPOSE 4200
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--poll", "2000"]

# ─────────────────────────────
# Build production
# ─────────────────────────────
FROM base AS build
COPY . .
RUN npm run build

# ─────────────────────────────
# Production (nginx)
# ─────────────────────────────
FROM nginx:alpine AS production
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
