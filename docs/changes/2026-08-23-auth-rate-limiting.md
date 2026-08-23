# feat(auth): rate limiting on auth routes

- **Date:** 2026-08-23
- **Type:** feat
- **Scope:** auth, app.module, main.ts

## What changed

Added `@nestjs/throttler@6.5.0` with a global limit of 100 requests/60 s per IP
applied via `APP_GUARD`. Auth mutation routes (`POST /auth/login`,
`/auth/register`, `/auth/refresh`) get a tighter override of 10 requests/60 s.
`GET /auth/me` is covered by the global limit only. `main.ts` now creates a
`NestExpressApplication` and calls `app.set('trust proxy', 1)` so throttling
keys on the real client IP behind Railway's proxy, not the proxy's IP.

## Why

The login, register, and refresh endpoints were open to brute-force and
credential-stuffing attacks with no request-rate enforcement. Behind Railway's
reverse proxy, the raw client IP was also invisible to any IP-based limit
without the trust-proxy setting.

## Notes

No new environment variables. No migrations. The `@nestjs/throttler` package
supports `@nestjs/common ^10` (peer dep range `^7 || ^8 || ^9 || ^10 || ^11`).
