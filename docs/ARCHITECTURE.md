# Architecture

Keymaker is a monorepo: one API app, one web app, and a shared package. Business logic and ranking live in the API and shared code; the web app is a client.

## Repo layout

```
Keymaker/
├── apps/
│   ├── api/          # Express API (TypeScript, Prisma)
│   └── web/          # Next.js 14 (App Router), React, Tailwind
├── packages/
│   └── shared/       # Shared types, constants, ranking-related constants
├── .github/workflows/
├── Dockerfile        # Builds and runs API only
├── turbo.json
├── pnpm-workspace.yaml
└── package.json      # Root scripts: dev, build, test, db:*, seed
```

- **pnpm workspaces** – `apps/*` and `packages/*` are workspace packages.
- **Turborepo** – Orchestrates `build` (with dependency order), `dev`, and `lint`. `build` for `api` depends on `@keymaker/shared`; `web` can depend on shared as needed.

## Data flow

1. **Browser** → **Web (Next.js)** – Renders UI and calls the API (fetch to `NEXT_PUBLIC_API_URL`, e.g. `/api`).
2. **Web** → **API (Express)** – REST over HTTP; auth via JWT in `Authorization: Bearer <token>`.
3. **API** → **PostgreSQL** – Via Prisma; schema and migrations in `apps/api/prisma/`.

The API is the single backend. It owns auth (JWT), validation (Zod), ranking (feed), and persistence. The web app does not talk to the database directly.

## API app structure (`apps/api`)

- **Entry** – `server.ts` starts the HTTP server; `app.ts` mounts the router and middleware.
- **Routes** – `src/routes/index.ts` mounts under `/api`: health, auth, users, communities, posts, comments, ratings, moderation.
- **Modules** – Per domain under `src/modules/` (e.g. `auth`, `posts`, `ratings`). Each typically has:
  - `*.routes.ts` – Route definitions and middleware (requireAuth, validateZod).
  - `*.controller.ts` – HTTP handlers; delegate to services.
  - `*.service.ts` – Business logic (no request/response).
  - `*.schema.ts` – Zod schemas for request validation.
- **Ranking** – `modules/ranking/` computes feed order (score = time decay × dampened content score). Uses community weights and cached aggregates from the DB; see README “Ranking” section.
- **Middleware** – `requireAuth` sets `req.user` from JWT and returns 401 if missing/invalid; `validateZod` validates body/query and returns 400 on failure.
- **Config** – `config/env.ts` loads `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV` and fails fast if required vars are missing.

Business logic and ranking live in **services** (and ranking module); controllers stay thin. Aggregates and scores are always computed server-side; the client never sends ranking or aggregate values to trust.

## Shared package (`packages/shared`)

- **Constants** – e.g. axis names, score min/max, `MIN_RATINGS_DAMPENING`, `DEFAULT_DECAY_HALF_LIFE_SECONDS` (see `packages/shared/src/constants.ts`).
- **Types** – Shared DTOs or types used by both API and web (if any).
- Used by the API for ranking and validation; the web can use it for display (axis labels, score bounds).

## Web app (`apps/web`)

- Next.js 14 with App Router under `src/app/`.
- UI calls the API with `NEXT_PUBLIC_API_URL`; auth token stored client-side (e.g. in memory or storage) and sent as Bearer token.
- Minimal, readable, functional UI; no single karma/upvotes/downvotes—evaluation is four-axis only (clarity, evidence, kindness, novelty).

## Database

- **PostgreSQL** – Single database; connection string in `DATABASE_URL`.
- **Prisma** – Schema in `apps/api/prisma/schema.prisma`; migrations in `prisma/migrations/`. Run `pnpm run db:generate` and `pnpm run db:migrate` (or equivalent) for local and production.
- **Seeding** – `pnpm run seed` (from api) populates dev data.

## Deployment

- **Container** – Dockerfile at repo root builds and runs the **API only** (see [DEPLOY.md](../DEPLOY.md)). Web can be built separately and served elsewhere or from the same host via a reverse proxy.
- **Env** – API needs `DATABASE_URL`, `JWT_SECRET`, and optionally `PORT`; web needs `NEXT_PUBLIC_API_URL` pointing at the API base URL.

For project and product rules (four-axis evaluation, no single karma, server-side ranking only), see `.cursor/rules/keymaker-project.mdc` and the README.
