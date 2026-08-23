# fix(app): gera Prisma Client no CI

- **Date:** 2026-08-23
- **Type:** fix
- **Scope:** app (CI)

## What changed
Adicionado um passo `npm --workspace=apps/api run prisma:generate` nos dois
jobs do `ci.yml` (lint-typecheck e test), logo após o build do `packages/shared`.

## Why
Os dois pipelines quebravam. Com `npm ci` limpo, o postinstall do
`@prisma/client` roda a partir da raiz e não encontra o schema (que fica em
`apps/api/prisma/schema.prisma`), então o client não é gerado. Sem os tipos de
`@prisma/client`, o `nest build` (job 1) e os testes (job 2) falham.
Localmente passava porque o client já tinha sido gerado no setup.

## Notes
- O script `prisma:generate` roda com cwd em `apps/api`, achando o schema e
  gerando para `node_modules/@prisma/client` (hoisted na raiz).
