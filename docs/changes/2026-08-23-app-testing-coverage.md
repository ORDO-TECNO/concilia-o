# chore(app): testing coverage — auth unit tests, guards, e2e, and web tests

- **Date:** 2026-08-23
- **Type:** chore
- **Scope:** api/auth, api/guards, api/e2e, web/lib

## What changed

Extended the API unit test suite from 28 to 48 tests across 7 spec files.
Added `auth.service.spec.ts` coverage for register, login, refresh rotation,
reuse-detection, and logout. Added `company-access.guard.spec.ts` and
`jwt-auth.guard.spec.ts`. Wired e2e tests in `apps/api/test/` (register, login,
tenant isolation 403) with `jest-e2e.json` and a `test:e2e` npm script.
Set up jest in `apps/web` with token-store and `refreshAccessToken` dedupe tests.
Added `coverageThreshold` to the API jest config (statements 14%, branches 12%,
functions 18%, lines 20% — based on measured numbers; ratchet up as new tests are added).

## Why

The project had 5 spec files covering only parsers, rule-matcher, and the
Google-user linking path. No auth flow, no guard, no e2e, and no web tests.
Phase 3 goal is a trustworthy safety net before the team grows.

## Notes

- `supertest@7.1.4` and `@types/supertest@6.0.3` added to `apps/api` devDependencies.
- `jest@29.7.0`, `ts-jest@29.2.5`, `@types/jest@29.5.13`, `jest-environment-jsdom@29.7.0`
  added to `apps/web` devDependencies.
- e2e setup file (`test/jest-e2e-setup.ts`) loads `dotenv` from the monorepo root
  and falls back to `.env.example` dev values so a fresh `docker-compose up` is
  enough to run `npm run test:e2e`.
- Coverage thresholds should be ratcheted up incrementally as controller and
  service tests are added in future phases (current overall is ~15% because most
  controllers/services have no specs yet).
- Break-a-test sanity check performed: removing the membership check from
  `CompanyAccessGuard.canActivate` made the "lança ForbiddenException" test fail.
