# Keymaker: multi-stage build for API + optional static web
# Set PORT and DATABASE_URL in the run environment.

FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# Build shared + API
FROM base AS api-builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm run build --filter @keymaker/shared
WORKDIR /app/apps/api
RUN npx prisma generate
WORKDIR /app
RUN pnpm run build --filter api

# Build web (optional: for serving static from API later)
FROM base AS web-builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build --filter @keymaker/shared
RUN pnpm run build --filter web

# Production: run API only (single process; web can be separate or reverse-proxied)
FROM base AS runner
ENV NODE_ENV=production
COPY --from=api-builder /app/apps/api ./apps/api
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/package.json ./
COPY --from=api-builder /app/pnpm-workspace.yaml ./
COPY --from=api-builder /app/packages/shared ./packages/shared

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/server.js"]
