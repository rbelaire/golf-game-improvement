# thegolfbuild

Golf practice planning web app. Users build profiles, generate drill routines via a rules engine, and track session completion.

## Stack

- **Backend:** Node.js (no framework), vanilla `http` module, CommonJS (`require`)
- **Database:** PostgreSQL via `pg` (prod), JSON file fallback (dev/Vercel tmp)
- **Frontend:** Single-page app — one `index.html`, one `app.js`, one `styles.css`. No build step, no bundler, no framework.
- **Hosting:** Vercel (serverless via `api/index.js` wrapper) + local dev via `node server.js`
- **Auth:** Bearer token sessions, pbkdf2 password hashing
- **Tests:** Node.js built-in test runner (`node --test tests/`)

## Key Files

| File | Purpose |
|---|---|
| `server.js` | HTTP server, all API route handlers, static file serving |
| `api/index.js` | Vercel serverless entry point (thin wrapper around `requestHandler`) |
| `lib/db.js` | Data layer — Postgres or JSON file, user/session/routine CRUD |
| `lib/drills.js` | Drill library, rules engine (`buildRulesRoutine`), profile validation |
| `lib/rate-limit.js` | In-memory rate limiter |
| `app.js` | All frontend logic (SPA routing, API calls, UI rendering) |
| `index.html` | Full app markup (all views/modals inline) |
| `styles.css` | All styles |
| `sw.js` | Service worker (PWA offline support) |

## API Routes

All under `/api/`. Auth routes: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/password`. Resources: `/profile`, `/routines`, `/routines/generate`, `/routines/:id/complete`, `/drills`, `/stats`. Admin: `/admin/users`, `/admin/users/promote`, `/admin/users/:id`, `/admin/me`. Billing: `/billing/upgrade-pro`.

## Conventions

- No TypeScript, no JSX, no transpilation — plain JS everywhere
- No external frontend dependencies (no React, no jQuery)
- All API responses use `sendJson(res, status, payload)`
- Auth via `Authorization: Bearer <token>` header, parsed by `parseAuthUser()`
- User roles: `user` (default) and `super` (admin)
- Plans: `free` (5 routine limit) and `pro` (unlimited)
- Run tests: `npm test`
- Run dev server: `npm start` (port 3000)
- Env vars: `DATABASE_URL`, `SUPER_USER_EMAIL`, `SUPER_USER_PASSWORD`, `SUPER_USER_NAME`, `ALLOWED_ORIGINS`
