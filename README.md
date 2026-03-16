# Keymaker

A Reddit-style platform with **four-axis evaluation** (clarity, evidence, kindness, novelty). No upvotes, downvotes, or single karma score.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Web**: Next.js 14 (App Router), React, TypeScript, Tailwind
- **API**: Express, TypeScript, Prisma
- **DB**: PostgreSQL
- **Deploy**: Railway-ready (Dockerfile, `railway.json`)

## Local development

### Prerequisites

- Node 18+
- pnpm 9+
- PostgreSQL

### Setup

1. **Clone and install**

   ```bash
   cd Keymaker
   pnpm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` at the repo root (or in `apps/api` for API-only). Set at least:

   - `DATABASE_URL` – PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/keymaker`)
   - `JWT_SECRET` – min 32 characters for auth
   - `NEXT_PUBLIC_API_URL` – API base URL for the browser (e.g. `http://localhost:3001/api`)

3. **Database**

   ```bash
   pnpm run db:generate
   pnpm run db:migrate
   pnpm run seed
   ```

   Or from `apps/api`:

   ```bash
   cd apps/api && npx prisma generate && npx prisma migrate dev && pnpm run seed
   ```

4. **Build shared package** (required before first run)

   ```bash
   pnpm run build
   ```

   This builds `@keymaker/shared` and the API. The web app will build on first `dev` or when you run `pnpm run build` from root.

5. **Run dev**

   ```bash
   pnpm run dev
   ```

   - API: http://localhost:3001  
   - Web: http://localhost:3000  

   Ensure `NEXT_PUBLIC_API_URL` points at `http://localhost:3001/api` so the web app can talk to the API.

## Railway deployment

1. **New project** – Create a new Railway project.

2. **PostgreSQL** – Add a PostgreSQL service. Copy the `DATABASE_URL` from the service variables.

3. **API service** – Add a new service from this repo (or from the Dockerfile):
   - **Build**: Use the Dockerfile at repo root, or set build command to `pnpm install && pnpm run build` and root directory to the repo root.
   - **Start**: If using Dockerfile, the image runs the API and can serve the Next.js export (see Dockerfile). If not using Docker, set start command to `pnpm run start --filter api` (after building) and ensure the API listens on `PORT` (Railway sets this).
   - **Variables**:
     - `DATABASE_URL` – from the PostgreSQL service
     - `JWT_SECRET` – generate a long random string (≥32 chars)
     - `NODE_ENV=production`
     - Optionally `NEXT_PUBLIC_API_URL` if the web is served from the same origin (e.g. `https://your-app.railway.app/api`).

4. **Migrations** – Run migrations once after deploy (e.g. via one-off command or in build):

   ```bash
   pnpm run db:migrate
   ```

   Or from `apps/api`: `npx prisma migrate deploy`.

5. **Seed** (optional):

   ```bash
   pnpm run seed
   ```

## Scripts

| Script         | Description                    |
|----------------|--------------------------------|
| `pnpm dev`     | Run API + web in dev           |
| `pnpm build`   | Build all packages             |
| `pnpm seed`    | Seed database (from api)       |
| `pnpm db:generate` | Generate Prisma client   |
| `pnpm db:migrate`  | Deploy migrations          |

## Product rules

- No upvotes, downvotes, agree/disagree, or single karma.
- Content is evaluated on four axes only: clarity, evidence, kindness, novelty.
- Ranking uses per-community weights and time decay; low-signal dampening applies.
- See `.cursor/rules/keymaker-project.mdc` for full project rules.
