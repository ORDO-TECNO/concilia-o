# chore(app): CI skeleton com lint, typecheck e testes

- **Date:** 2026-08-22
- **Type:** chore
- **Scope:** .github/workflows, .github/dependabot.yml

## What changed

Substituiu o workflow de CI mínimo por dois jobs separados: `lint-typecheck`
(lint de todos os workspaces + build do shared + build do API e web para
typecheck) e `test` (jest do API com service container do Postgres 16).
Todas as actions foram pinadas a SHAs completos com comentário de versão.
Adicionado `.github/dependabot.yml` para atualizações semanais de npm e
github-actions, com cooldown de 7 dias e grouping de minor/patch.

## Why

O projeto não tinha CI funcional com lint, typecheck ou postgres para os
testes. Sem isso não é possível validar PRs automaticamente.

## Notes

- Actions pinadas: `actions/checkout@11d5960a...` (v4.4.0),
  `actions/setup-node@49933ea5...` (v4.4.0).
- `actionlint` e `zizmor` não estavam disponíveis no ambiente de execução;
  validação manual foi feita.
- Deploy (Railway/Vercel) é escopo da Fase 4 completa, não deste skeleton.
