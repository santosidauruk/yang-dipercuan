# Deployment — Sumopod (VPS)

> **Status: skeleton.** Sumopod-specific control panel and image options were not available in the docs index used during PRD drafting (Context7 returned no results for "Sumopod"). Confirm the steps below against Sumopod's actual dashboard before relying on them. Sections marked **TODO** need verification on the Sumopod control panel during first deploy.

Granary is a Next.js 16 app with `/api/stocks/*` route handlers (server-side `yahoo-finance2` calls). It needs a Node runtime — **static export will not work**.

## Recommended path: Docker + reverse proxy

This is the most portable approach across any VPS provider, including Sumopod.

### 1. Dockerfile

Add to repo root (`frontend/Dockerfile`):

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

Requires `output: 'standalone'` in `next.config.ts`. Add it.

### 2. `.dockerignore`

```
node_modules
.next
.git
.env*
docs
README.md
```

### 3. Build and push image

```bash
# Local build
docker build -t granary:latest .

# Test locally
docker run --rm -p 3000:3000 granary:latest

# Tag and push to Sumopod's registry (or Docker Hub / GHCR)
# TODO: confirm Sumopod registry URL and auth method
docker tag granary:latest registry.sumopod.example/granary:latest
docker push registry.sumopod.example/granary:latest
```

### 4. Deploy on Sumopod

**TODO** — fill in once Sumopod control panel inspected. Generic shape:

1. Provision VPS or container instance with at least 512MB RAM.
2. Pull and run the image (or use Sumopod's container UI).
3. Map host port `80` → container `3000` (or run behind nginx/Caddy).
4. Set up TLS via Sumopod's built-in certs or Caddy auto-HTTPS.

## Alternative: bare Node + PM2

If Sumopod gives you raw VPS rather than container hosting, here is a checklist of the standard Next.js VPS deploy:

```bash
# On the VPS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2

# Pull repo and build
git clone <repo-url> /opt/granary
cd /opt/granary/frontend
npm ci
npm run build

# Start with PM2
pm2 start npm --name granary -- run start
pm2 save
pm2 startup    # follow output to enable on boot
```

Then proxy `:80` → `:3000` with nginx or Caddy.

### Caddy snippet

```caddy
granary.example.com {
    reverse_proxy localhost:3000
}
```

Caddy handles certificates automatically.

## Environment variables

The current app only needs:

- `NODE_ENV=production` (set by Docker / PM2).

The brief removes login + the AI key is BYO client-side, so no `.env` secrets are required server-side.

## Health check

```
GET https://your-domain/api/stocks/quote?code=BBCA
```

Should return `200` with a JSON quote payload. If Yahoo Finance blocks the request, the IP may be on a denylist — try a different region for the VPS.

## Update deploy

```bash
# On host: pull, rebuild, restart
cd /opt/granary
git pull
cd frontend
npm ci
npm run build
pm2 restart granary
```

For Docker: rebuild image, push, redeploy.

## Open items (verify on first deploy)

- **TODO** Sumopod registry URL and auth (token / keypair).
- **TODO** Sumopod outbound IP — ensure Yahoo Finance does not rate-limit.
- **TODO** Sumopod-specific cron / log retention features.
- **TODO** Backup strategy for `~/.granary` if any server-side state ever introduced (currently none — all data is in user's browser localStorage).
