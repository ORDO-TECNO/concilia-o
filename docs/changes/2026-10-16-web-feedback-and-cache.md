# feat(web): feedback de erro, cache e cadastros

- **Date:** 2026-10-16
- **Type:** feat
- **Scope:** web (lib/toast, query-client, hooks, cadastros, lançamentos)

## What changed
Toaster sem dependência + `MutationCache.onError` global: toda mutação que falha mostra a mensagem da API. Mutations de lançamento, importação, regras e categorias invalidam também DFC e dashboard. Selects de categoria usam `toCategoryOptions` (agrupadoras desabilitadas). Desativar categoria/conta; só contas ativas no import; filtro "Sem categoria".

## Why
Erros eram silenciosos e DFC/dashboard ficavam desatualizados depois de classificar.
