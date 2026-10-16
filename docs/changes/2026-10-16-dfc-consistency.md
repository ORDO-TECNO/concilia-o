# fix(dfc): DFC e dashboard consistentes com o status de conciliação

- **Date:** 2026-10-16
- **Type:** fix
- **Scope:** dfc, dashboard, shared (enums, dto/dfc), web (dfc)

## What changed
`CASHFLOW_EXCLUDED_STATUSES` (IGNORADO, DUPLICADO) em `packages/shared`, usado por DFC e dashboard. A DFC ganhou `unclassified` (linha "Não classificado", fora dos saldos, com link para a grade filtrada) e arredondamento ao centavo. `?year=` validado (antes NaN → 500). Dashboard agrega com `groupBy` no banco.

## Why
A DFC somava lançamentos ignorados/duplicados; o dashboard excluía só ignorados — os dois divergiam e marcar "duplicado" não tinha efeito.

## Notes
`DFCReport.unclassified` é campo novo no contrato da API.
