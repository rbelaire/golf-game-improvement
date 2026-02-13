# golf-game-improvement

## Run locally

```bash
npm start
```

Then open `http://localhost:3000`.

## Deploy to Vercel

This project is ready for Vercel with:
- Static frontend served from the repo root (`index.html`, `app.js`, `styles.css`)
- API served by `api/index.js` (rewritten from `/api/*` via `vercel.json`)
- Persistent storage via Postgres when `DATABASE_URL` is configured

Deploy:

```bash
vercel --prod
```

## Important data note

Set `DATABASE_URL` in your Vercel project (for example from Vercel Postgres, Neon, Supabase, etc.). When present, the app stores users/sessions/routines in Postgres table `app_state`.

If `DATABASE_URL` is not set, filesystem writes fall back to `/tmp/golf-game-improvement` on Vercel, which is ephemeral and can lose data between cold starts/redeploys.

## AI routine generation

To enable AI-generated routines, set:
- `OPENAI_API_KEY` (required for AI generation)
- `OPENAI_MODEL` (optional, defaults to `gpt-4o-mini`)

If `OPENAI_API_KEY` is missing or the AI response is invalid, the server automatically falls back to the built-in deterministic routine generator.
