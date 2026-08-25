# fix(imports): wrap data writes in $transaction for all-or-nothing import

- **Date:** 2026-08-24
- **Type:** fix
- **Scope:** imports

## What changed

`ImportsService.import()` now wraps all data writes — `insertTransactions`,
`createPeriods`, and the final batch status update to CONCLUIDO — inside a
single `prisma.$transaction` with a 30-second timeout. The `importBatch` row
is still created outside the transaction (PROCESSANDO), so a failed import
leaves a FALHOU record with an `errorMessage` rather than a batch stuck in
PROCESSANDO. Classification rule application runs after the transaction commits
(outside it) because it is re-runnable and keeping it out avoids holding a
long transaction.

## Why

A failure mid-import previously left partial transaction rows, orphaned period
records, and the import batch stuck in PROCESSANDO with no way to distinguish
it from one still in progress. The schema already had `ImportStatus.FALHOU`
and `errorMessage`; this change wires them up.

## Notes

- `insertTransactions` and `createPeriods` signatures now accept a
  `Prisma.TransactionClient` parameter — internal methods, no public API change.
- `insertTransactions` returns `insertedIds` so the caller can pass them to
  `applyToTransactions` after commit.
- New unit tests cover the FALHOU path (mocked `$transaction` rejection) and
  the `applyToTransactions`-not-called-on-failure invariant.
- New e2e test (`test/imports.e2e-spec.ts`) covers the CONCLUIDO success path
  and duplicate-detection re-import.
