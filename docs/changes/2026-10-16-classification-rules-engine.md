# fix(classification-rules): motor de regras campo a campo

- **Date:** 2026-10-16
- **Type:** fix
- **Scope:** classification-rules, web (regras)

## What changed
`resolveClassification` resolve categoria e fornecedor separadamente (primeira regra que bate e define cada um), sem sobrescrever fornecedor manual; gravação em `updateMany` agrupado. Regras exigem alvo, regex válida e alvos atribuíveis; PATCH parcial. CONTAINS/EQUALS ignoram acentos e espaços repetidos. Tela de regras: ativar/desativar e coluna de fornecedor.

## Why
Regra só de fornecedor marcava `categorySource=REGRA` sem categoria e bloqueava regras de categoria de prioridade menor; um UPDATE por lançamento.
