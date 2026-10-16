# fix(transactions): integridade entre empresas na classificação

- **Date:** 2026-10-16
- **Type:** fix
- **Scope:** transactions, classification-rules, categories, common/domain

## What changed
Novo helper `common/domain/assignable.ts`: categoria atribuível = mesma empresa, ativa, folha com linha da DFC; fornecedor/cliente = mesma empresa. Aplicado no PATCH de lançamento, no bulk CATEGORIZAR e no cadastro de regras. O PATCH de categoria passou a validar que o pai é da mesma empresa.

## Why
Era possível referenciar categoria/fornecedor de outra empresa (vazamento entre tenants) e classificar em categoria agrupadora, o que fazia o valor sumir da DFC.

## Notes
Dados legados inconsistentes não são migrados — ver plano em `docs/review-2026-10-scan.md`.
