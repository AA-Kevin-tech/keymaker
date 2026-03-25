# Deployment

Keymaker runs as a **single container** that serves the API. The web app can be built separately and served by the same host (e.g. static files behind a reverse proxy) or by a separate Next.js deployment.

## Docker

The repo root has a multi-stage Dockerfile. The production image runs **only the API** (Express on port 3001).

### Build

From the repo root:

```bash
docker build -t keymaker-api .
```

### Run

Set at least `PORT`, `DATABASE_URL`, and `JWT_SECRET` in the run environment:

```bash
docker run -p 3001:3001 \
  -e PORT=3001 \
  -e DATABASE_URL="postgresql://user:password@host:5432/keymaker?schema=public" \
  -e JWT_SECRET="your-production-secret-min-32-characters" \
  keymaker-api
```

- **PORT** – Defaults to 3001 in the Dockerfile; override if your host uses another port.
- **DATABASE_URL** – PostgreSQL connection string. Use a production DB; the container does not run Postgres.
- **JWT_SECRET** – Must be at least 32 characters. Use a strong secret in production.

Optional:

- **NODE_ENV** – Set to `production` in the image; override only if needed.

### Database

The API image **runs `prisma migrate deploy` on each container start** before `node dist/server.js`, so pending migrations apply automatically when `DATABASE_URL` is set (e.g. Railway). If a migration fails, the process exits and the platform should surface the error in deploy logs.

You can still run migrations manually from your machine when the DB is reachable:

- `pnpm run db:migrate` (same as `pnpm --filter api exec prisma migrate deploy`) with the same `DATABASE_URL`.

For **multiple API replicas**, Prisma uses a migration lock; avoid concurrent deploys that start many new containers at once, or run migrations in a dedicated release step instead.

Ensure the database exists and is reachable from the container (same network or allowed firewall rules).

## Web app

The Dockerfile builds the web app in a separate stage but the default `runner` stage does not serve it. Options:

1. **Separate deployment** – Build and run the Next.js app elsewhere (e.g. Vercel, or another container) and set `NEXT_PUBLIC_API_URL` to your API base URL (e.g. `https://api.example.com/api`).
2. **Same host, reverse proxy** – Build the web app (e.g. `pnpm run build --filter web`), export or serve the static output from the same host (e.g. Nginx) and reverse-proxy `/api` to the API container.

### Railway note (important for Next.js)

`NEXT_PUBLIC_API_URL` is compiled into the browser bundle at build time. For Docker-based web deploys, pass it as a build arg so `next build` sees it.

Example:

```bash
docker build -f Dockerfile.web \
  --build-arg NEXT_PUBLIC_API_URL="https://keymaker-production.up.railway.app/api" \
  -t keymaker-web .
```

Also set it as a runtime env var on the web service for clarity, but build-time injection is the critical part.

For **server-rendered pages** (community feeds, etc.), the web container also reads **`API_URL`**: the absolute API base (same value as `NEXT_PUBLIC_API_URL`, e.g. `https://your-api-service.up.railway.app/api`). Set this on the **web** service at runtime so SSR hits the same API as the browser. If `API_URL` is omitted, the server falls back to `NEXT_PUBLIC_API_URL` (which may be absent or stale if it was not present at **build** time).

If the **web** and **API** are separate Railway services (each with its own public URL), the **web** hostname does **not** serve Express under `/api` by default—requests to `https://<web-host>/api/...` hit Next.js and return 404. Point **`NEXT_PUBLIC_API_URL`** and **`API_URL`** at the **API** service’s public base (e.g. `https://<api-service>.up.railway.app/api`), or use a reverse proxy so `/api` on the web host forwards to the API container.

## Reverse proxy

In production, put the API behind HTTPS (e.g. Nginx, Caddy, or a cloud load balancer). Example Nginx upstream:

```nginx
location /api {
  proxy_pass http://localhost:3001;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Health check

The API exposes a health endpoint:

- **GET** `/api/health` → `{ "status": "ok" }`

Use this for load balancer or container health checks.
