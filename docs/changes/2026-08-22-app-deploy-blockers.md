# chore(app): deploy blockers — env validation, cookie, health check

- **Date:** 2026-08-22
- **Type:** chore
- **Scope:** app, auth

## What changed

Added env validation at boot: `ConfigModule` now calls a `validateEnv` function
that lists `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, and
`CORS_ORIGIN` as required; missing vars cause a clear fatal error before the app
starts accepting requests. Hardcoded secret fallbacks (`'dev-*-secret-change-me'`)
have been removed from `auth.service.ts` and `jwt-access.strategy.ts`; secrets
are now read via injected `ConfigService`. The refresh cookie now uses
`sameSite: 'none'` + `secure: true` in production (Vercel → Railway is
cross-site) and keeps `sameSite: 'lax'` for local dev. `GET /health` now runs a
Prisma `SELECT 1` probe and returns 503 if the DB is unreachable.

## Why

The API previously booted silently in production with insecure hardcoded secrets,
the refresh cookie was broken on cross-site deployments (Vercel + Railway), and
there was no health endpoint for Railway probes.

## Notes

- `CORS_ORIGIN` was already listed in `.env.example` — no new vars added.
- Railway release step should run `npm run prisma:deploy --workspace=apps/api`
  (script already exists; document in README during Phase 4/5 runbook).
- The ESLint config (`apps/api/.eslintrc`) was absent before this change;
  the `lint` script fails regardless — pre-existing gap, not introduced here.
