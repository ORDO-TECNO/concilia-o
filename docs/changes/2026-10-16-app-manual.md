# chore(app): manual técnico interativo

- **Date:** 2026-10-16
- **Type:** chore
- **Scope:** docs/manual, README, CLAUDE.md

## What changed
Novo `docs/manual/index.html`: visão geral, fluxo do usuário, diagramas clicáveis de arquitetura, módulos e ER (campos armazenados × derivados), sequências em mermaid (importação, refresh token, OAuth, deploy, CI), simulador do pipeline de importação (com a lógica atual e a anterior à varredura), playground do motor de regras, simulador de agregação da DFC, referência filtrável da API, regras de negócio, variáveis de ambiente, roadmap e glossário.

## Why
A documentação estava espalhada entre README, dev-phases e changes; faltava uma visão navegável do sistema inteiro.

## Notes
Os simuladores reimplementam em JS a lógica de `csv-statement.parser.ts`, `non-movement.ts`, `dedupe.ts`, `rule-matcher.ts` e `dfc.service.ts`. Mudou a regra, atualize o manual.
