# thegolfbuild

Golf practice planning web app. Users build profiles, generate drill routines via a rules engine, and track session completion.

## Stack

- **Backend:** Node.js (no framework), vanilla `http` module, CommonJS (`require`)
- **Database:** PostgreSQL via `pg` (prod: Neon), JSON file fallback (dev without `DATABASE_URL`)
- **Frontend:** Single-page app — one `index.html`, one `app.js`, one `styles.css`. No build step, no bundler, no framework.
- **Hosting:** Vercel (serverless via `api/index.js` wrapper) + local dev via `node server.js`
- **Auth:** Bearer token sessions (30-day expiry), pbkdf2 password hashing
- **Tests:** Node.js built-in test runner (`node --test tests/`)

## Key Files

| File | Purpose |
|---|---|
| `server.js` | HTTP server, all API route handlers, static file serving, `.env` loader |
| `api/index.js` | Vercel serverless entry point (thin wrapper around `requestHandler`) |
| `lib/db.js` | Data layer — Postgres or JSON file, user/session/routine CRUD |
| `lib/drills.js` | Drill library (330 drills), rules engine (`buildRulesRoutine`), profile validation |
| `lib/rate-limit.js` | In-memory rate limiter |
| `app.js` | All frontend logic (SPA routing, API calls, UI rendering) |
| `index.html` | Full app markup (all views/modals inline) |
| `styles.css` | All styles (dark/light theme via `data-theme` attribute) |
| `sw.js` | Service worker (PWA offline support, auth endpoints excluded from cache) |
| `.env` | Local env vars (gitignored) — `DATABASE_URL`, `PGSSLMODE` |

## API Routes

All under `/api/`. Auth routes: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/password`. Resources: `/profile`, `/routines`, `/routines/generate`, `/routines/:id`, `/routines/:id/complete`, `/drills`, `/stats`. Admin: `/admin/users`, `/admin/users/promote`, `/admin/users/:id`, `/admin/me`. Billing: `/billing/upgrade-pro`.

## Frontend Architecture

- **Navigation:** 6 tabs managed by `setPlanMode(mode)` — `home`, `generated`, `custom`, `drills`, `stats`, `saved`
- **Home dashboard** is the default landing page with quick stats, active routine card, and action buttons
- **Custom routine builder** is a 3-step flow: setup → session builder (drill picker + manual tasks) → preview
- **Save button** uses POST for new routines, PUT for updating existing ones (checks `currentRoutine.id`)
- **Routines cached** in localStorage as fallback for ephemeral server storage
- **Drill library** loaded lazily from `/api/drills`, cached in `drillLibraryCache`
- **Profile form** uses button groups (handicap) and chip grid (weaknesses) instead of `<select>` dropdowns
- **Weaknesses** support up to 2 selections; stored as both `weaknesses` (array) and `weakness` (string, first item) for backward compat
- **Rules engine** alternates weakness focus across sessions when 2 weaknesses are selected

## Data Model Notes

- Profile has both `weakness` (string) and `weaknesses` (array of 1-2 strings). `normalizeProfile()` in `lib/drills.js` always produces both fields.
- Legacy profiles with only `weakness` (string) are fully supported — `validateProfileShape()` accepts either format.
- `profileSnapshot` stored in routines may have either format; stats in `lib/db.js` handle both.

## Conventions

- No TypeScript, no JSX, no transpilation — plain JS everywhere
- No external frontend dependencies (no React, no jQuery)
- All API responses use `sendJson(res, status, payload)`
- Auth via `Authorization: Bearer <token>` header, parsed by `parseAuthUser()`
- User roles: `user` (default) and `super` (admin)
- Plans: `free` (5 routine limit) and `pro` (unlimited)
- Run tests: `npm test`
- Run dev server: `npm start` (port 3000)
- Env vars: `DATABASE_URL`, `PGSSLMODE`, `SUPER_USER_EMAIL`, `SUPER_USER_PASSWORD`, `SUPER_USER_NAME`, `ALLOWED_ORIGINS`
