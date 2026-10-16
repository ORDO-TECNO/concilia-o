# Varredura de regras de negócio, consistência e arquitetura — out/2026

Revisão completa de `apps/api`, `apps/web` e `packages/shared` feita na branch
`claude-scan-impl`. Este documento registra **o que foi encontrado**, **o que
já foi corrigido** (com o commit) e **o plano** para o que ficou de fora.
O `README.md` continua sendo a verdade atual das regras; os resumos de cada
área estão em `docs/changes/2026-10-16-*.md`.

Legenda de severidade: **S1** perda/corrupção de dados ou vazamento entre
empresas · **S2** número errado em relatório ou regra documentada não
aplicada · **S3** consistência/UX/performance.

---

## 1. Achados corrigidos nesta branch

### 1.1 Importação (`imports`)

| # | Sev. | Problema | Correção |
|---|------|----------|----------|
| I1 | S1 | Dois lançamentos idênticos no mesmo extrato (ex: duas tarifas iguais no dia) → o 2º era descartado como "duplicado". | Hash com índice de ocorrência; 1ª ocorrência mantém o hash legado (`dedupe.ts`). |
| I2 | S2 | Linhas "SALDO ANTERIOR / SALDO DO DIA" entravam como movimentação com o valor do saldo. | `non-movement.ts`; contadas em `ignoredRecords` (antes sempre 0). |
| I3 | S2 | Valores `1.234,56-`, `1.234,56 D`, `R$ -10,00` lidos com sinal errado ou descartados. | `parseAmount` reescrito. |
| I4 | S2 | Data inexistente (31/02) virava `Invalid Date` e derrubava o import inteiro. | Validação de calendário. |
| I5 | S2 | CSV em ordem decrescente → saldos de abertura/fechamento trocados. | Normalização cronológica. |
| I6 | S2 | `statementStartBalance` era o saldo *depois* do 1º lançamento. | Saldo antes do 1º lançamento. |
| I7 | S2 | OFX com `TRNTYPE=DEBIT` e valor positivo virava entrada. | Sinal corrigido. |
| I8 | S3 | OFX SGML em linha única falhava no parse. | Normalização por regex no corpo inteiro. |
| I9 | S1 | Era possível importar OFX de outra conta na conta errada. | `account-match.ts` (tolerante a máscara/dígito). |
| I10 | S2 | Importava em conta inativa. | Bloqueado. |
| I11 | S3 | `recordCount` por período contava duplicados (README dizia o contrário). | Só inseridos. |
| I12 | S3 | Dedupe carregava todo o histórico da conta a cada import. | Busca restrita ao intervalo de datas e fitIds do arquivo; contagens vêm de `createManyAndReturn`. |
| I13 | S3 | Histórico de importações devolvia o arquivo bruto de todos os lotes. | `select` sem `rawContent`. |
| I14 | S2 | Falha ao aplicar regras após o commit → 500 com import gravado → reenvio = tudo duplicado. | Erro logado, import responde OK. |
| I15 | S3 | Preview CSV sem arquivo → 500. | 400. |

### 1.2 Integridade entre empresas e classificação

| # | Sev. | Problema | Correção |
|---|------|----------|----------|
| T1 | S1 | PATCH de lançamento aceitava categoria/fornecedor **de outra empresa**. | `common/domain/assignable.ts`. |
| T2 | S1 | Bulk CATEGORIZAR idem. | Mesmo helper. |
| T3 | S1 | Regras aceitavam categoria/fornecedor de outra empresa. | Mesmo helper. |
| T4 | S1 | PATCH de categoria aceitava pai de outra empresa. | Validação no update. |
| T5 | S2 | Classificar em categoria agrupadora (sem linha da DFC) sumia com o valor da DFC. | Só folhas ativas com linha; front desabilita agrupadoras. |
| T6 | S3 | Remover categoria deixava `categorySource = MANUAL`. | Limpa a origem. |
| T7 | S3 | Paginação sem desempate → linhas repetidas/puladas. | `id` como desempate. |

### 1.3 Categorias

| # | Sev. | Problema | Correção |
|---|------|----------|----------|
| C1 | S2 | Ciclo A→B→A aceito; as categorias sumiam da árvore. | Detecção de ciclo. |
| C2 | S2 | "Receita" podia ser mapeada a "Dividendos". | `dfcLinesForKind` (shared) na API e no formulário. |
| C3 | S2 | Folha com lançamentos podia ganhar filhas e continuar com linha da DFC. | Vira agrupadora; bloqueado se tem lançamentos/regras. |
| C4 | S2 | Excluir categoria usada por regra deixava a regra sem alvo (SetNull). | Bloqueado. |
| C5 | S3 | "Desative em vez de excluir" sem forma de desativar; PATCH exigia todos os campos. | `UpdateCategoryDto` com `isActive`; botão na tela. |
| C6 | S3 | Seed criava agrupadoras com linha da DFC. | Seed corrigido. |

### 1.4 Regras de classificação

| # | Sev. | Problema | Correção |
|---|------|----------|----------|
| R1 | S2 | Regra só-de-fornecedor marcava `categorySource=REGRA` sem categoria e bloqueava regras de categoria de prioridade menor. | Resolução campo a campo (`resolveClassification`). |
| R2 | S2 | Regra sobrescrevia fornecedor escolhido manualmente. | Só preenche se vazio. |
| R3 | S3 | Regra sem alvo / regex inválida eram aceitas (nunca casavam). | Validação ao salvar. |
| R4 | S3 | "Energia Elétrica" não casava com "ENERGIA ELETRICA". | Normalização sem acento/espaços. |
| R5 | S3 | Um UPDATE por lançamento. | `updateMany` agrupado em transação. |
| R6 | S3 | PATCH exigia nome/padrão (toggle de ativo quebrava). | DTO parcial; botão Ativar/Desativar. |

### 1.5 DFC e dashboard

| # | Sev. | Problema | Correção |
|---|------|----------|----------|
| D1 | S2 | DFC somava lançamentos IGNORADO/DUPLICADO. | `CASHFLOW_EXCLUDED_STATUSES` (shared). |
| D2 | S2 | Dashboard excluía só IGNORADO (divergia da DFC). | Mesma constante. |
| D3 | S2 | Fluxo não classificado sumia sem aviso. | Linha "Não classificado" + link para a grade. |
| D4 | S3 | Erro de ponto flutuante nos subtotais. | Arredondamento ao centavo. |
| D5 | S3 | `?year=abc` → 500. | `YearQueryDto`. |
| D6 | S3 | Dashboard carregava o ano inteiro em memória. | `groupBy` no banco (e2e de caracterização garante o mesmo resultado). |

### 1.6 Cadastros, erros e front

| # | Sev. | Problema | Correção |
|---|------|----------|----------|
| A1 | S1 | Excluir conta bancária apagava em cascata todos os lançamentos e importações. | Bloqueado com histórico; botão Desativar. |
| A2 | S3 | PATCH de conta/fornecedor/empresa exigia todos os campos. | DTOs parciais. |
| A3 | S3 | CNPJ/CPF texto livre; máscara furava a unicidade. | Só dígitos + dígito verificador. |
| A4 | S3 | Unique/FK do Prisma viravam 500. | P2002/P2003 → 409, P2025 → 404. |
| W1 | S3 | Erros de mutação silenciosos no front. | Toaster + `MutationCache.onError`. |
| W2 | S3 | DFC/dashboard desatualizados depois de classificar/importar. | `invalidateTransactionViews`. |
| W3 | S3 | Três cópias de `flattenCategories`. | `lib/categories.ts`. |
| W4 | S3 | Sem fila de "não classificados". | Filtro "Sem categoria" (`uncategorized=true`). |
| CI1 | S3 | CI subia Postgres mas nunca rodava e2e nem testes do web. | Steps adicionados. |

Cobertura nova: 129 testes unitários (eram 58) e 41 e2e (eram 10).

---

## 2. Achados ainda abertos (plano)

Ordenados por prioridade. Cada item é independente o bastante para um PR.

### P1 — Transferências entre contas da mesma empresa (S2)
Uma transferência da conta A para a conta B aparece como saída em A e entrada
em B. No dashboard isso infla receitas e despesas; na DFC só não distorce
porque o usuário deixa sem categoria (e agora aparece em "Não classificado").
**Plano:** novo `CategoryKind.TRANSFERENCIA` (ou flag `isTransfer`), sem linha
da DFC e fora do dashboard; sugestão automática de pares (mesmo valor com
sinal oposto, mesma data ±1 dia, contas da mesma empresa) com confirmação.
Migration de enum aditiva.

### P2 — Conciliação de saldo por extrato (S2)
"Conciliar" hoje é só um status. Os extratos já trazem saldo de abertura e
fechamento (`ImportBatch`, `ImportBatchPeriod`), mas nada confere se
`abertura + Σ lançamentos = fechamento`. **Plano:** endpoint por conta/mês
com a diferença, alerta na tela de importação quando o extrato não fecha
(linha perdida, sinal errado, filtro de saldo indevido) — base do
"dashboard de qualidade da conciliação" da Fase 5.

### P3 — Migração de dados legados (S2)
As validações novas valem para gravações futuras. Script único (migration de
dados ou comando) para: normalizar `companies.cnpj` e `parties.document` para
dígitos (detectando colisões antes); zerar `dfcLine` de categorias com filhas;
listar lançamentos/regras apontando para agrupadoras ou categorias inativas
para reclassificação.

### P4 — Exclusão de lançamentos apaga a memória do dedupe (S2)
Bulk EXCLUIR é hard delete: o próximo import do mesmo período traz o
lançamento de volta. **Plano:** trocar por soft delete (`deletedAt`) que
continua participando do dedupe, ou restringir a exclusão a lançamentos
manuais e orientar o uso de IGNORADO/DUPLICADO.

### P5 — Regex de usuário executada no servidor (S3, segurança)
Padrão REGEX roda em Node sem limite de tempo (ReDoS: `(a+)+$`). Limite de
200 caracteres ajuda pouco. **Plano:** `re2` (sem backtracking) ou rejeitar
quantificadores aninhados na validação.

### P6 — Competência × caixa (S3, regra a decidir)
`competenceYear/Month` deriva de `date`; `settlementDate` é ignorado. Para
DFC pelo regime de caixa a data de liquidação é a correta quando existe.
**Decisão de produto necessária** antes de mudar.

### P7 — CNPJ de empresa único globalmente (S3)
Um segundo usuário não consegue cadastrar a mesma empresa (P2002 → agora
409). O caminho certo é convite para a empresa existente — entra no RBAC da
Fase 2.

### P8 — Arquivo bruto no Postgres e imports grandes (S3)
`rawContent` guarda o extrato inteiro na tabela; o upload é lido em memória
(20 MB) e a transação tem timeout de 30 s. **Plano:** mover o bruto para
object storage (S3/R2) com chave no lote; `createManyAndReturn` em lotes de
~5 mil linhas.

### P9 — Tipo da subcategoria × tipo do pai (S3)
Nada impede uma folha "Receita" sob uma agrupadora "Despesas". Exigir tipo
igual ao do pai (e bloquear troca de tipo de pai com filhas de outro tipo).

### P10 — Front: edição e erros em formulários (S3)
Cadastros só têm criar/excluir/desativar — não há edição de nome, padrão ou
prioridade de regra, nem de categoria/fornecedor. Handlers usam
`await mutateAsync` sem `try` (o toast mostra o erro, mas a rejeição fica
não tratada no console). Dialog de edição reaproveitando os formulários de
criação.

### P11 — Pequenos
- `previewToken: 'stateless'` no preview do CSV não tem função — remover do
  contrato.
- Seletor de ano da DFC é fixo (ano atual ±); derivar dos anos com dados.
- `UserCompany.role` não é lido em lugar nenhum (esperado até a Fase 2).
- Excluir fornecedor anula `partyId` em regras (SetNull); avaliar bloquear
  como foi feito para categorias.

---

## 3. Arquitetura — observações

- **Regras de domínio no lugar certo.** As validações novas ficam no backend
  (`common/domain`, serviços) e o front só espelha para UX
  (`dfcLinesForKind`, `toCategoryOptions`). Constantes que as duas pontas
  precisam (`CASHFLOW_EXCLUDED_STATUSES`, mapeamento tipo → linha, CPF/CNPJ)
  moram em `packages/shared`, como já era o caso da `dfc-structure`.
- **Padrão de autorização em rotas por `:id`.** Continua sendo "carrega o
  recurso → `assertUserBelongsToCompany`". Funciona, mas é fácil esquecer
  de validar as *referências* do corpo (era a origem de T1–T4). Sugestão
  para a Fase 2: um guard/decorator `@CompanyScoped()` que resolve o
  `companyId` do recurso e injeta no handler, e os helpers de
  `common/domain` para todo id estrangeiro do corpo.
- **PATCH com DTO de criação** era um padrão repetido em cinco módulos;
  todos usam `PartialType` agora — manter assim em módulos novos.
- **Testes.** `test/helpers.ts` (boot + tenant + limpeza) reduz o custo de
  um e2e novo a poucas linhas; e2e agora roda no CI.
