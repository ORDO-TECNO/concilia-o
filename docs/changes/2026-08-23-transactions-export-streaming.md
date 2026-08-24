# feat(transactions): streaming export for CSV and XLSX

- **Date:** 2026-08-23
- **Type:** feat
- **Scope:** transactions.service, transactions.controller, common/export/table-export

## What changed

The `/companies/:companyId/transactions/export` endpoint no longer loads all
matching rows into memory before responding. CSV is now piped through
`csv-stringify` in stream mode; XLSX uses `ExcelJS.stream.xlsx.WorkbookWriter`.
Both formats fetch rows in cursor-paginated batches of 1 000 (keyset on `id`,
with the requested sort field as the primary key). The Express `Response` is
written to incrementally — process memory stays roughly flat regardless of
row count.

The controller now calls `streamExport(companyId, query, res)` instead of
receiving a `{ buffer, filename, contentType }` tuple. Headers
(`Content-Type`, `Content-Disposition`) are set before the first byte is
written to the stream, so the client sees them immediately.

The eleven export columns and their order are unchanged: Data, Descrição,
Histórico, Documento, Valor, Tipo, Categoria, Fornecedor/Cliente, Status,
Conta, Competência.

## Why

With large company datasets (200 k+ transactions) the previous `findMany` +
in-memory `Buffer` approach spikes process RSS proportionally and risks OOM.
NFR-1 requires constant memory usage during export.

## Notes

- No new dependencies. `csv-stringify` (streaming API) and `exceljs`
  (`WorkbookWriter`) were already in use.
- `buildCsvBuffer` / `buildXlsxBuffer` are kept in `table-export.ts` for
  the test suite; they are no longer called by the transactions module.
- `TransactionsService.toExportRow` is now a `static` method, making it
  directly testable without a Prisma instance.
- 6 new unit tests added in `src/common/export/table-export.spec.ts` covering
  `toExportRow`, `buildCsvBuffer`, `streamCsvExport` (multi-batch + empty), and
  `streamXlsxExport` (PK magic bytes + non-empty output).
- Manual verification: exported a CSV and XLSX from a seeded local DB; both
  opened correctly in LibreOffice Calc with all eleven columns and UTF-8
  accents intact.
