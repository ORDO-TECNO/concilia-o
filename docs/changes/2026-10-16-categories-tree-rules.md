# fix(categories): regras da árvore de categorias

- **Date:** 2026-10-16
- **Type:** fix
- **Scope:** categories, shared (dfc-structure), web (cadastros/categorias), seed

## What changed
PATCH parcial com `isActive` (desativar). Ciclos na árvore são recusados. Linha da DFC precisa ser compatível com o tipo (`dfcLinesForKind` em `packages/shared`, também usado no formulário). Folha que ganha subcategoria vira agrupadora (perde a linha; bloqueado se já tem lançamentos/regras). Exclusão bloqueada se há regras apontando. Seed sem linha da DFC em agrupadoras.

## Why
A regra "só folhas recebem lançamentos e têm linha da DFC" estava documentada mas não era aplicada; e a mensagem "desative em vez de excluir" não tinha como ser seguida.
