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

Use Railway to deploy: connect your GitHub repo and Railway will build from the repo root Dockerfile and deploy on every push.

### 1. Create a Railway project

1. Go to [railway.app](https://railway.app) and create a **New project**.
2. Add **PostgreSQL**: in the project, click **+ New** → **Database** → **PostgreSQL**. Copy the `DATABASE_URL` from the PostgreSQL service variables (or from **Variables** in the project).
3. Add your app: **+ New** → **GitHub Repo** → select this repo. Railway will add a service linked to the repo.

### 2. Configure the app service

The repo includes `railway.json` and a root **Dockerfile**, so Railway will use them automatically. You only need to set variables:

- In the **app service** (the one from GitHub), open **Variables** and add (or paste from the PostgreSQL service):
  - `DATABASE_URL` – from the PostgreSQL service
  - `JWT_SECRET` – a long random string (≥32 characters)
  - `NODE_ENV` = `production`
- Optionally set `NEXT_PUBLIC_API_URL` to your API URL (e.g. `https://your-app.railway.app/api`) if the web app needs it.

### 3. Deploy trigger

- **Option A – Railway’s GitHub deploy**: In the app service, **Settings** → **Deploy** → enable **Deploy on push** and choose the branch (e.g. `main`). Every push to that branch will build and deploy.
- **Option B – GitHub Actions**: The workflow in `.github/workflows/deploy.yml` runs `railway up` on push to `main`. You need a **project token** in Railway (project **Settings** → **Tokens**) and add it in GitHub as a repo secret named `RAILWAY_TOKEN`. If you have multiple services, add `RAILWAY_SERVICE_ID` as well.

### 4. Run migrations after first deploy

After the first successful deploy, run migrations once. In Railway: app service → **Settings** → run a one-off command, or use the **Shell** tab:

```bash
pnpm run db:migrate
```

Or from the repo root with Railway CLI: `railway run pnpm run db:migrate`.

### 5. Seed (optional)

```bash
pnpm run seed
```

(Same as above: one-off in Railway or `railway run pnpm run seed`.)

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
