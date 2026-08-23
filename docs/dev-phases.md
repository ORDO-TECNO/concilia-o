# Ordo — Review & Development Phases

## Context

Ordo is a vibe-coded bank-reconciliation / DFC platform (NestJS + Prisma API,
Next.js 14 web, `packages/shared` for DTOs and the DFC structure). The domain
logic is strong; the goal now is to get it to a **smooth, reliable deploy on
Railway (API) + Vercel (web)** and raise the engineering floor before the team
grows.

This document breaks the work into **independent, agent-orchestratable phases**.
Each phase is scoped so a single agent can own it end-to-end, with explicit
files, acceptance criteria, and verification. Phases are ordered by dependency
and risk: deploy blockers first, then OAuth, then testing/CI, then design
cleanup.

Decisions already made:
- **Deploy**: Railway (API + managed Postgres) + Vercel (web).
- **Google OAuth**: added *alongside* email/password, with account linking on
  matching email (`passwordHash` becomes optional).
- **Tooling**: keep eslint/prettier/jest (no migration to ox*/vitest).
- **Change docs**: every medium-or-larger change ships with a brief changelog
  entry (convention defined below).

## Change documentation convention (cross-cutting)

Every medium-or-larger change gets a **short doc** — a brief resume, not a
design essay. This gives the growing team (and future agents) a scannable
history of *what changed and why* without spelunking git.

Structure:
- `docs/changes/` — one markdown file per change, named
  `YYYY-MM-DD-<module>-<slug>.md` (e.g. `2026-08-22-auth-oauth-google.md`).
- `docs/changes/CHANGELOG.md` — an index: one line per entry, newest first
  (`- YYYY-MM-DD — type(module): one-liner → [doc](file.md)`).

Each entry file is ~10–20 lines, filled from this template:

```markdown
# <type(module)>: <short title>

- **Date:** YYYY-MM-DD
- **Type:** feat | fix | chore
- **Scope:** <modules/areas touched>

## What changed
<2–4 sentences. Plain language.>

## Why
<1–2 sentences. The problem or need.>

## Notes
<Optional: migrations, env vars, breaking changes, follow-ups.>
```

Rules:
- **Medium-or-larger only.** Typos, formatting, and trivial tweaks don't need
  an entry — a commit message is enough. When in doubt: does a teammate need
  to know this happened without reading the diff? If yes, write one.
- Written at the **same time as the change**, in the same PR/commit as the code.
- Keep it a *resume* — link to code/PR for detail, don't restate the diff.
- This is complementary to the repo's small-commit discipline in `CLAUDE.md`,
  and distinct from `README.md` (business rules) — change docs are the
  *history*, README is the *current truth*.

Groundwork (part of Phase 0): create `docs/changes/` with the template and an
empty `CHANGELOG.md`, and add a one-line note to `CLAUDE.md` pointing here so
the convention is discoverable.

### Key findings from initial review (grounding for the phases)

Strengths — keep as-is:
- Clean module-per-domain NestJS layout; DTOs + `class-validator`; global
  `ValidationPipe` with `whitelist`/`forbidNonWhitelisted` (main.ts).
- Refresh-token rotation with reuse detection and full-family revocation
  (`auth.service.ts:66-112`) — genuinely good.
- `CompanyAccessGuard` enforces tenant membership per route
  (`common/guards/company-access.guard.ts`).
- Single source of truth for DFC hierarchy in `packages/shared`.

Gaps to fix (mapped to phases below):
1. **Secrets fall back to hardcoded defaults** (`'dev-*-secret-change-me'`) in
   `auth.service.ts`, `jwt-access.strategy.ts`. No env validation — the API
   boots in prod with insecure secrets silently. **Deploy blocker.**
2. **Cross-site cookie**: refresh cookie is `sameSite: 'lax'`
   (`auth.controller.ts:68`); Vercel↔Railway is cross-site, so refresh dies in
   prod. **Deploy blocker.**
3. **No rate limiting** on `/auth/login` / `/auth/register` — brute-force open.
4. **No CI**, no health check endpoint, no structured error/observability.
5. **Testing thin**: 4 spec files (parsers, rule-matcher, dfc.service). No
   controller/e2e/auth tests, no web tests, no coverage thresholds.
6. **OAuth**: nothing exists; `User.passwordHash` is required (schema change
   needed).
7. **Design nits**: env read via `process.env` scattered instead of
   `ConfigService`; `any` casts in `api-client.ts`; no request-scoped logging.

---

## Phase 0 — Deploy blockers (do first)

**Goal:** API + web can run safely in production on Railway/Vercel.

Scope:
- **Env validation at boot.** Add a validation schema to
  `ConfigModule.forRoot(...)` in `apps/api/src/app.module.ts` (use the
  `validate` fn or `joi`/zod). Require `JWT_ACCESS_SECRET`,
  `JWT_REFRESH_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`; fail fast if missing.
- **Remove hardcoded secret fallbacks.** Delete every
  `?? 'dev-*-secret-change-me'` / `?? 'dev-access-secret-change-me'` in
  `auth.service.ts` and `jwt-access.strategy.ts`; read from validated config.
  Prefer injecting `ConfigService` over raw `process.env`.
- **Cross-site cookie.** In `auth.controller.ts` `setRefreshCookie`, use
  `sameSite: 'none'` + `secure: true` when `NODE_ENV === 'production'` (keep
  `lax`/insecure for local). Confirm `enableCors` keeps `credentials: true`
  and `CORS_ORIGIN` is set to the Vercel domain.
- **Health check.** Add `GET /health` (extend `app.controller.ts`) returning
  200 + a Prisma `SELECT 1` check, for Railway health probes.
- **Prod migrations.** Document/wire `prisma migrate deploy` as the Railway
  release step (script already exists: `prisma:deploy`).
- **Docker-compose hygiene.** Note that `pgadmin` (default creds) is local-only
  and must not ship; leave compose for dev.

Key files: `apps/api/src/app.module.ts`, `apps/api/src/main.ts`,
`apps/api/src/modules/auth/auth.service.ts`,
`apps/api/src/modules/auth/strategies/jwt-access.strategy.ts`,
`apps/api/src/modules/auth/auth.controller.ts`,
`apps/api/src/app.controller.ts`, `.env.example`.

Acceptance:
- API refuses to boot without required secrets (verified by unsetting one).
- No string `change-me` remains in `apps/api/src`.
- `GET /health` returns 200 with DB reachable.

Verify: `grep -rn "change-me" apps/api/src` → empty; boot with a missing var →
clear error; local login/refresh still works with dev cookie settings.

---

## Phase 1 — Auth hardening

**Goal:** Close the brute-force and abuse gaps before exposing login publicly.

Scope:
- Add `@nestjs/throttler` (look up current stable version). Global default +
  a tighter limit on `/auth/login`, `/auth/register`, `/auth/refresh`.
- Trust proxy for correct client IPs behind Railway (`app.set('trust proxy', 1)`
  in `main.ts`) so throttling keys on real IP.
- Optional: generic-timing on login (already returns generic message — good).

Key files: `apps/api/src/main.ts`, `app.module.ts`, `auth` module + controller.

Acceptance: repeated bad logins get 429; normal flows unaffected.
Verify: script N rapid login attempts → 429 after threshold; jest test on the
throttle guard config.

---

## Phase 2 — Google OAuth (alongside password, with linking)

**Goal:** "Sign in with Google" that reuses the existing token machinery and
links to an existing account when the verified email matches.

Schema (`apps/api/prisma/schema.prisma`) — new migration:
- `User.passwordHash` → optional (`String?`).
- Add `User.provider` (enum `LOCAL | GOOGLE` or a join table `AuthIdentity`),
  `googleId String? @unique`, optional `avatarUrl`.
  Recommended: an `AuthIdentity { userId, provider, providerUserId }` table so
  future providers don't reshape `User`. Keep it minimal for now if preferred.
- Guard the register/login password paths against provider-only accounts (a
  Google-only user has no `passwordHash` → password login returns the generic
  "invalid credentials").

Backend flow:
- Add `passport-google-oauth20` strategy + `GET /auth/google` (redirect) and
  `GET /auth/google/callback`. Reuse `issueTokens()` in `auth.service.ts` — do
  **not** duplicate token logic.
- **Linking rule:** on callback, if a user with the verified Google email
  exists, attach the Google identity to that user; else create a new user.
  Only link on Google-verified emails.
- **Cross-domain handoff:** API (Railway) handles the callback, sets the
  httpOnly refresh cookie (`sameSite:none;secure`), then 302-redirects to a
  Vercel web route with a short-lived one-time code or the access token in the
  URL fragment. Prefer the code-exchange pattern over putting the access token
  in the querystring.

Config: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
added to env validation (Phase 0) and `.env.example`. Callback URL registered
in Google Cloud console for both localhost and the Railway domain.

Frontend (`apps/web`):
- "Continue with Google" button on `app/(auth)/login` and `/register`.
- A callback page that consumes the handoff, calls `setAccessToken`, and routes
  to `/dashboard`. Reuse `lib/api-client.ts` / `lib/auth/token-store`.

Key files: `apps/api/prisma/schema.prisma` (+ migration),
`apps/api/src/modules/auth/*` (new strategy, controller routes, service
linking method), `apps/web/app/(auth)/*`, `apps/web/lib/auth/*`.

Acceptance:
- New Google user → account created; returning Google user → same account;
  Google email matching an existing password user → linked (single user row).
- Password login still works for local users; provider-only user can't password-login.

Verify: jest tests for the linking service method (new user / returning /
link-on-match / no-link-on-unverified); manual end-to-end Google login in dev.

---

## Phase 3 — Testing coverage

**Goal:** Trustworthy safety net beyond the current 4 unit specs, using jest.

Scope (API):
- **Auth service** unit tests: register/login/refresh rotation, **reuse
  detection revokes family**, logout, OAuth linking (from Phase 2).
- **Guards**: `CompanyAccessGuard` (member vs non-member),
  `JwtAuthGuard`.
- **e2e** (`@nestjs/testing` + supertest, test Postgres via the existing
  docker service or testcontainers): auth flow + one tenant-scoped resource
  (transactions) proving cross-company access is denied (403).
- Add `collectCoverage` thresholds to the jest config in
  `apps/api/package.json` (start realistic, e.g. 60%, ratchet up).

Scope (web): the team kept jest-only; add lightweight tests for
`lib/api-client.ts` refresh-dedupe behavior and token-store. (No component/RTL
suite required now — flag as future.)

Key files: `apps/api/**/*.spec.ts` (new), `apps/api/test/*.e2e-spec.ts` (new),
`apps/api/package.json` (jest coverage config).

Acceptance: `npm --workspace=apps/api run test` green; coverage report emitted;
a deliberately broken guard makes a test fail (mutation sanity check).

Verify: run test suite; temporarily break `CompanyAccessGuard` → the tenant
e2e test fails.

---

## Phase 4 — CI/CD

**Goal:** Every PR is linted, type-checked, and tested; Railway/Vercel deploy
on merge to main.

Scope:
- `.github/workflows/ci.yml`: install → build `packages/shared` → `lint` →
  `tsc --noEmit` → API jest (+ Postgres service container for e2e). Pin actions
  to SHA with version comments; `persist-credentials: false`.
- Dependabot config (grouped, cooldown) per global standards.
- Deploy: Railway auto-deploy from main with `prisma migrate deploy` release
  step; Vercel project for `apps/web` (root dir + `NEXT_PUBLIC_API_URL`).
- Run `actionlint` + `zizmor` on the workflow before commit.

Key files: `.github/workflows/ci.yml`, `.github/dependabot.yml`,
Railway/Vercel project settings (documented in README).

Acceptance: PR triggers CI; red on failing test/lint; main deploys.
Verify: open a draft PR, confirm checks run; introduce a lint error → CI red.

---

## Phase 5 — Design pattern & code-quality cleanup (lower risk, do last)

**Goal:** Reduce sharp edges now that behavior is covered by tests.

Scope:
- Replace scattered `process.env.X ?? default` reads with injected
  `ConfigService` (consistency; env already validated in Phase 0).
- Remove `any` casts in `apps/web/lib/api-client.ts` (`ApiError` message
  extraction) with a typed narrowing helper.
- Add request logging / error correlation (Nest `Logger` or `pino`) — the
  `HttpExceptionFilter` is the natural hook.
- Confirm every tenant-scoped controller pairs `JwtAuthGuard` +
  `CompanyAccessGuard` (spot-checked transactions; sweep the rest:
  bank-accounts, categories, parties, imports, classification-rules, dfc,
  dashboard).
- README: update auth section (OAuth), deploy runbook (Railway/Vercel envs).

Key files: across `apps/api/src/modules/*/*.controller.ts`,
`apps/web/lib/api-client.ts`, `common/filters/http-exception.filter.ts`,
`README.md`.

Acceptance: no `any` in api-client; every `:companyId` route has both guards;
lint clean.
Verify: `grep -rn "UseGuards" apps/api/src/modules` audit; `npm run lint`.

---

## Orchestration notes (for agent hand-off)

- **Ordering / dependencies:** Phase 0 → 1 gate everything (deploy safety).
  Phase 2 depends on Phase 0 (cookie + env). Phase 3 should follow/parallel
  Phase 2 (needs the OAuth service to test it). Phase 4 can start after Phase 3
  gives it something to run. Phase 5 last.
- **Parallelizable** (separate worktrees, minimal overlap): Phase 1 (auth
  hardening) and an early cut of Phase 4 (CI skeleton) can run alongside
  Phase 2. Keep Phase 0 as a single serialized PR since it touches auth core.
- Each phase = one focused PR, commit style `type(module): ...` per the repo's
  commit discipline. Never push to main directly.
- **Every phase produces at least one `docs/changes/` entry** (see the change
  documentation convention above) in the same PR as its code. Update
  `docs/changes/CHANGELOG.md`.
- Always `npm run build --workspace=packages/shared` before API/web work.
- Never run `next build` while `next dev` is active (corrupts `.next`).
