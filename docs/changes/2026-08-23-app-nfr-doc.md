# chore(app): requisitos não-funcionais e plano de escala

- **Date:** 2026-08-23
- **Type:** chore
- **Scope:** app (docs)

## What changed
Adicionado `docs/non-functional-requirements.md` — NFRs com metas mensuráveis
(export streaming, import atômico/background, dedupe por constraint, índices e
regras em lote, ciclo de vida do dado histórico, auditoria) e plano por
prioridade, ancorado no código atual.

## Why
Preparar a aplicação para muito volume de dados por empresa (10-15 usuários,
mas anos de extratos). Concorrência não é o gargalo nessa escala; o foco é
evitar operações em memória e tornar o import robusto.

## Notes
- Itens 🔴 (export streaming, import atômico) são os que quebram com dado real.
- Particionamento/sharding considerado prematuro nesta escala.
