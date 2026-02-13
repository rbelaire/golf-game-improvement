# golf-game-improvement

## Run locally

```bash
npm start
```

Then open `http://localhost:3000`.

Run tests:

```bash
npm test
```

## Project structure

```
server.js              HTTP server, route handlers, auth helpers
lib/
  db.js                Database abstraction (Postgres + JSON file fallback)
  drills.js            DRILL_LIBRARY (30 drills with descriptions), rules engine, profile helpers
  rate-limit.js        In-memory IP-based sliding-window rate limiter
api/
  index.js             Vercel serverless wrapper
data/
  db.json              Local dev database (JSON file)
tests/
  api.test.js          API test suite (node:test, 43 tests)
index.html             SPA frontend
app.js                 Frontend logic
styles.css             Styling
sw.js                  Service worker (PWA offline support)
manifest.webmanifest   PWA manifest
```

## Features

### Practice Session Tracking
Mark individual sessions complete within any saved routine. Each week shows a progress bar tracking how many sessions you've finished. Completion state syncs to the server and persists across devices.

### Drill Library Browser
Browse all 30 drills grouped by weakness category (Driving accuracy, Approach consistency, Short game touch, Putting confidence, Course management, plus cross-cutting Foundation drills). Click any drill to expand its full description, see its type (warmup/technical/pressure/transfer), and which skill levels it targets.

### Performance Dashboard
View your stats at a glance: routines saved, sessions completed, current streak, and longest streak. A session progress bar shows overall completion percentage, and a weakness coverage chart shows how your practice time is distributed across categories.

### Routine Export (PDF & iCal)
Export any routine to PDF for printing (opens a print-friendly view) or download as an `.ics` calendar file that adds each session to your phone calendar with drill details and proper time blocks.

### PWA / Offline Support
The app installs on mobile home screens via a web app manifest and service worker. Static assets are cached for offline access, and API responses use a network-first strategy with cache fallback — so you can view your current routine at the range even with spotty signal.

## Deploy to Vercel

This project is ready for Vercel with:
- Static frontend served from the repo root (`index.html`, `app.js`, `styles.css`)
- API served by `api/index.js` (rewritten from `/api/*` via `vercel.json`)
- Persistent storage via Postgres when `DATABASE_URL` is configured

Deploy:

```bash
vercel --prod
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | No | Postgres connection string. When set, uses normalized tables (`users`, `sessions`, `routines`) with `pg.Pool`. Without it, falls back to JSON file at `data/db.json`. |
| `ALLOWED_ORIGINS` | No | Comma-separated origins for CORS (e.g. `https://example.com,https://staging.example.com`). When unset, no CORS headers are sent (same-origin only). |
| `SUPER_USER_NAME` | No | Display name for the bootstrap super user. |
| `SUPER_USER_EMAIL` | No | Email for the bootstrap super user. Both email and password must be set. |
| `SUPER_USER_PASSWORD` | No | Password for the bootstrap super user (min 8 chars). |
| `PORT` | No | Server port (default: `3000`). |
| `DB_DIR` | No | Override directory for JSON file storage. |
| `PGSSLMODE` | No | Set to `disable` to turn off SSL for Postgres connections. |

## Database

### Postgres mode (`DATABASE_URL` set)

On startup, `db.init()` creates three normalized tables:

- **users** — id, name, email, plan, role, salt, password_hash, profile (JSONB)
- **sessions** — token, user_id, created_at
- **routines** — id, user_id, title, meta, profile_snapshot (JSONB), weeks (JSONB), completions (JSONB), created_at

If an `app_state` table exists (legacy single-JSONB-row format), data is automatically migrated into the new tables and `app_state` is dropped.

Uses `pg.Pool` (max 10 connections) instead of a single client.

### JSON file mode (no `DATABASE_URL`)

Falls back to `data/db.json`. On Vercel without Postgres, writes go to `/tmp/golf-game-improvement` which is ephemeral — data can be lost between cold starts/redeploys.

## Security

- **Rate limiting** — Auth endpoints (`/api/auth/login`, `/api/auth/register`) are limited to 10 requests per 60 seconds per IP.
- **Session expiry** — Tokens expire after 30 days. Expired sessions are cleaned up every 6 hours.
- **Security headers** — All responses include `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, and `Permissions-Policy`.
- **Input validation** — Field length limits on all user inputs, email format validation, password length bounds (8-128 chars).
- **Graceful shutdown** — SIGTERM/SIGINT close the HTTP server, drain the connection pool, then exit.

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Log in |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/auth/logout` | Yes | Log out |
| PUT | `/api/auth/password` | Yes | Change password |
| GET | `/api/profile` | Yes | Get profile |
| PUT | `/api/profile` | Yes | Update profile |
| GET | `/api/drills` | No | List all drills with descriptions |
| POST | `/api/routines/generate` | Yes | Generate routine (rules engine) |
| GET | `/api/routines` | Yes | List saved routines |
| POST | `/api/routines` | Yes | Save routine |
| PUT | `/api/routines/:id` | Yes | Update routine |
| DELETE | `/api/routines/:id` | Yes | Delete routine |
| POST | `/api/routines/:id/complete` | Yes | Toggle session completion |
| GET | `/api/stats` | Yes | Get user performance stats |
| POST | `/api/billing/upgrade-pro` | Yes | Upgrade to Pro |
| GET | `/api/admin/me` | Yes | Admin status check |
| GET | `/api/admin/users` | Super | List all users |
| POST | `/api/admin/users/promote` | Super | Promote user to super |
| PUT | `/api/admin/users/:id` | Super | Update user plan/role |

## Routine generation

Routines are generated entirely by the built-in rules engine (no AI provider or API key required). The drill library contains 30 drills across 5 weakness categories, scored by relevance, skill level, type preference, and recency.

## Super user bootstrap

To ensure a super user exists on startup, set `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD`. The account is created (or updated) once during `db.init()` with `role: "super"` and `plan: "pro"`.
