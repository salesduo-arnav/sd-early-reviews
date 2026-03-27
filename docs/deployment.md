# Deployment Guide

Run the full stack (PostgreSQL + Backend + Frontend) with Docker Compose.

## Prerequisites

- Docker & Docker Compose installed
- All API keys ready (see `.env` section below)

## Steps

### 1. Clone & create `.env`

```bash
cp .env.example .env
```

Fill in all `<SECRET_...>` values (see template below).

### 2. Build & run

```bash
docker compose up --build -d
```

This starts 3 containers:

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `reviews-db` | postgres:16-alpine | 5432 | PostgreSQL database |
| `reviews-backend` | node:20-alpine | 3030 | Express API server |
| `reviews-frontend` | nginx:alpine | 5173 | React SPA + API proxy |

### 3. Verify

```bash
docker compose ps          # all 3 should be "Up"
curl http://localhost:5173  # frontend loads
curl http://localhost:5173/api/health  # backend responds via nginx proxy
```

### 4. Logs

```bash
docker compose logs -f backend   # backend logs
docker compose logs -f postgres  # db logs
docker compose logs -f frontend  # nginx logs
```

### 5. Stop / teardown

```bash
docker compose down            # stop containers (keeps data)
docker compose down -v         # stop + delete database volume
```

## What happens on startup

1. **postgres** starts, healthcheck waits until ready
2. **backend** starts after postgres is healthy, runs `sequelize db:migrate` automatically, then starts the Express server
3. **frontend** builds the React app with Vite (build args from `.env`), serves via nginx on port 5173, proxies `/api/*` requests to backend

## `.env` Template

```env
# --- Database ---
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb

# --- Backend ---
PGHOST=localhost
PGPORT=5432
PGUSER=myuser
PGPASSWORD=mypassword
PGDATABASE=mydb

NODE_ENV=development
PORT=3030
ADMIN_EMAILS=admin@salesduo.com
MAX_NOTIFICATIONS_PER_USER=15
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# Auth
JWT_SECRET=
JWT_ACCESS_TOKEN_EXPIRY=2h
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_OTP_TOKEN_EXPIRY=10m

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Google OAuth
GOOGLE_CLIENT_ID=

# RapidAPI (ASIN lookup)
RAPID_API_KEY=

# AWS S3 (image uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=

# Amazon SP-API
AMZN_SP_APP_ID=
AMZN_SP_CLIENT_ID=
AMZN_SP_CLIENT_SECRET=
AMZN_SP_REDIRECT_URI=http://localhost:3030/callback
SP_API_ENCRYPTION_KEY=
SP_API_SANDBOX_MODE=false
SP_API_MOCK_MODE=false
REVIEW_VERIFICATION_MOCK_MODE=false

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Wise
WISE_API_TOKEN=
WISE_PROFILE_ID=
WISE_MODE=sandbox
WISE_WEBHOOK_SECRET=

# Exchange Rates
OPEN_EXCHANGE_RATES_APP_ID=
EXCHANGE_RATE_CACHE_HOURS=24

# --- Frontend (build args) ---
VITE_API_BASE_URL=/api
VITE_GOOGLE_CLIENT_ID=
STRIPE_PUBLISHABLE_KEY=
```

## Resource Estimates

### Minimum (dev / small deployment)

| Resource | Estimate |
|----------|----------|
| **Disk** | ~2 GB (images: ~500 MB postgres + ~300 MB node + ~50 MB nginx, plus build cache) |
| **RAM** | ~512 MB total (postgres ~128 MB, backend ~256 MB, nginx ~32 MB) |
| **CPU** | 1 vCPU is sufficient |

### Recommended (production, light traffic)

| Resource | Estimate |
|----------|----------|
| **Disk** | 5–10 GB (includes DB growth, uploaded images go to S3) |
| **RAM** | 1–2 GB |
| **CPU** | 2 vCPU |

### Notes

- Uploaded images are stored in **S3**, not on disk — DB volume is the main disk consumer
- The frontend is a static build served by nginx — near-zero resource usage
- The backend's cron job (auto-payouts) runs in-process, no extra container needed
- For production, put a reverse proxy (Caddy/Cloudflare) in front for SSL
