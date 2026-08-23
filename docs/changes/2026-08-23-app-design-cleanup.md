# chore(app): design pattern & code-quality cleanup

- **Date:** 2026-08-23
- **Type:** chore
- **Scope:** api/main, auth/controller, common/filters, web/lib/api-client, README

## What changed

Replaced remaining raw `process.env` reads in `main.ts` and `auth.controller.ts`
with injected `ConfigService` for consistency with the validated config established
in Phase 0. Removed the `any` cast in `apps/web/lib/api-client.ts` (`ApiError`
message extraction) with a typed narrowing helper. Added structured logging
(`Logger.warn` / `Logger.error`) to `HttpExceptionFilter` so every 4xx/5xx
records method, path, status, and message without logging bodies or tokens.
Updated README with a deploy runbook (Railway env vars + release step,
Vercel root dir + env var).

## Why

Raw `process.env` reads bypass the boot-time validation added in Phase 0 and
are inconsistent with the rest of the codebase. The `any` cast suppressed
type-checker coverage on a public API boundary. No structured logging on errors
made diagnosing production failures harder. The README lacked deploy guidance
for the Railway + Vercel setup introduced in Phases 0 and 2.

## Notes

Guard sweep confirmed: every `:companyId` route has both `JwtAuthGuard` and
`CompanyAccessGuard`. Routes using `/:id` without `:companyId` (e.g.
`PATCH /transactions/:id`) enforce ownership via `assertUserBelongsToCompany`
at the service level — intentional design, not a gap.
