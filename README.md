# Keymaker

A Reddit-style platform with **four-axis evaluation** (clarity, evidence, kindness, novelty). No upvotes, downvotes, or single karma score.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Web**: Next.js 14 (App Router), React, TypeScript, Tailwind
- **API**: Express, TypeScript, Prisma
- **DB**: PostgreSQL
- **Deploy**: Dockerfile at repo root for container deployment

## Documentation

- [DEPLOY.md](DEPLOY.md) – Docker build/run, env, and production deployment
- [docs/API.md](docs/API.md) – API endpoints, auth, and request/response overview
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) – Monorepo layout, data flow, and module structure

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

## Tests

API tests use Vitest and Supertest. They require a running PostgreSQL (use your dev DB or a separate test DB).

```bash
pnpm run test
```

Or from `apps/api`: `pnpm run test` (or `pnpm run test:watch` for watch mode). Set `DATABASE_URL` and `JWT_SECRET` (e.g. in `.env` or export them). CI runs lint and test on push/PR; see [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Scripts

| Script         | Description                    |
|----------------|--------------------------------|
| `pnpm dev`     | Run API + web in dev           |
| `pnpm build`   | Build all packages             |
| `pnpm test`    | Run API tests (Vitest)         |
| `pnpm lint`    | Type-check / lint              |
| `pnpm seed`    | Seed database (from api)       |
| `pnpm db:generate` | Generate Prisma client   |
| `pnpm db:migrate`  | Deploy migrations          |

## Ranking

Feed order is determined by a **score** computed per post:

- **Formula:** `score = timeDecay * dampenedContentScore`
- **Time decay:** `0.5^(ageSeconds / decayHalfLifeSeconds)` — newer posts rank higher. Each community has a `decayHalfLifeSeconds` (default 24h = 86400).
- **Content score:** `weightClarity*cachedClarity + weightEvidence*cachedEvidence + weightKindness*cachedKindness + weightNovelty*cachedNovelty`. Each community defines the four weights (default 1).
- **Low-signal dampening:** If a post has fewer than `MIN_RATINGS_DAMPENING` ratings (see `packages/shared`), its content score is scaled by `ratingCount / MIN_RATINGS_DAMPENING` so posts with very few ratings don't dominate.

Constants (in `packages/shared/src/constants.ts`):

- `MIN_RATINGS_DAMPENING` — minimum ratings before content score is fully counted (default 2).
- `DEFAULT_DECAY_HALF_LIFE_SECONDS` — default half-life for time decay (86400 = 24 hours).

Community settings (stored in DB, editable via API and community settings UI): `weightClarity`, `weightEvidence`, `weightKindness`, `weightNovelty`, `decayHalfLifeSeconds`.

## Product rules

- No upvotes, downvotes, agree/disagree, or single karma.
- Content is evaluated on four axes only: clarity, evidence, kindness, novelty.
- Ranking uses per-community weights and time decay; low-signal dampening applies.
- See `.cursor/rules/keymaker-project.mdc` for full project rules.
