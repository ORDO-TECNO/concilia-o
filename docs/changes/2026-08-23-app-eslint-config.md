# chore(app): configura ESLint em todos os workspaces

- **Date:** 2026-08-23
- **Type:** chore
- **Scope:** app, api, web, shared

## What changed

Adicionado `.eslintrc.cjs` na raiz (cobre `apps/api` e `packages/shared`) com
`@typescript-eslint/recommended` + `eslint-config-prettier`. Adicionado
`apps/web/.eslintrc.json` estendendo `next/core-web-vitals` (instalado
`eslint-config-next@14.2.35`). Corrigidas todas as violações encontradas:
3 erros de `no-unused-vars` em `auth.service.ts` (variáveis `_prefixadas`
agora reconhecidas pela config), e 8 avisos de `no-explicit-any` resolvidos
com tipos próprios em `ofx-statement.parser.ts`, `imports.service.ts` e nos
specs de `dfc.service` e `rule-matcher`.

## Why

`npm run lint` falhava por ausência total de config ESLint, bloqueando o CI.

## Notes

- `eslint-config-next` versão 14.2.35 (exata, alinhada com `next@14.2.35`).
- Regra `@typescript-eslint/no-unused-vars` configurada para ignorar variáveis
  prefixadas com `_` (convenção padrão para descarte intencional em desestruturação).
- Não foram ativadas regras `type-checked` (muita pressão para um primeiro passe).
