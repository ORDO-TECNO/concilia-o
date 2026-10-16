# fix(imports): correção de dedupe, parsers e contagens da importação

- **Date:** 2026-10-16
- **Type:** fix
- **Scope:** imports (service, parsers CSV/OFX, dedupe)

## What changed
O hash de dedupe agora carrega o índice da ocorrência, então lançamentos idênticos no mesmo extrato entram todos (a 1ª ocorrência mantém o hash legado). Os parsers descartam linhas de saldo e valores zero (contados em `ignoredRecords`, antes sempre 0), aceitam sinal no fim / sufixo D/C, rejeitam datas inexistentes, reordenam CSV decrescente e calculam o saldo de abertura antes do 1º lançamento. OFX aceita arquivo em linha única e TRNTYPE DEBIT com valor positivo. Importação em conta inativa ou OFX de outra conta é recusada; `recordCount` por período conta só o inserido; o histórico não devolve mais o `rawContent`.

## Why
A segunda tarifa idêntica do dia era descartada como duplicada (perda de dados), "SALDO ANTERIOR" entrava como movimentação, e o saldo de abertura vinha errado.

## Notes
Sem migration. Hashes já gravados continuam válidos. Testes: `dedupe.spec`, `non-movement.spec`, `account-match.spec`, parsers e `imports.e2e-spec`.
