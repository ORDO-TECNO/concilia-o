# Ordo — Requisitos não-funcionais (NFRs) e plano

## Contexto

Escala esperada: **10-15 usuários**, mas **muito volume de dados por empresa**
ao longo dos anos (extratos mensais acumulando dezenas a centenas de milhares
de lançamentos por conta). Com essa quantidade de usuários, **concorrência não
é o gargalo** — o Postgres com bons índices aguenta milhões de linhas. Os riscos
reais são: operações que carregam "tudo em memória", robustez do import
(especialmente o backfill inicial de anos) e o ciclo de vida do dado histórico.

Este documento define os NFRs com **metas mensuráveis** e o plano de
implementação. Particionamento/sharding é considerado **prematuro** nesta escala.

Convenções de execução (iguais ao `docs/dev-phases.md`): uma fase = um PR
focado; cada fase gera um doc em `docs/changes/`; `type(module): ...` nos commits.

---

## NFRs e estado atual

### NFR-1 — Export não pode estourar memória
**Meta:** exportar qualquer volume (ex.: 200k lançamentos) com uso de memória
**constante/limitado**, sem OOM; primeiro byte da resposta em < 2 s.

**Hoje:** `transactions.service.ts` `export` faz `findMany` de **todas** as
linhas e monta um `Buffer` em memória (CSV e XLSX). Pico proporcional ao volume
— maior risco de derrubar o processo com dado real.

**Abordagem:** streaming. CSV via `csv-stringify` em stream ligado à `Response`;
XLSX via workbook em streaming do `exceljs` (`WorkbookWriter`). Buscar linhas em
páginas (cursor) e escrever incrementalmente. Sem materializar array completo.

---

### NFR-2 — Import robusto e atômico (inclui backfill grande)
**Meta:** importar um arquivo de **50k linhas** sem timeout de HTTP; import é
**tudo-ou-nada** (falha não deixa dados parciais nem batch preso em
`PROCESSANDO`); status e erro sempre refletem a realidade.

**Hoje:** `imports.service.ts:42-101` processa tudo **dentro do request**
(parse → dedupe → insert → regras → períodos), sem `$transaction`. Arquivo
grande arrisca timeout; falha no meio deixa lixo.

**Abordagem:**
- Envolver criação do batch + insert + períodos + status em
  `prisma.$transaction` (atomicidade). Em erro, marcar `FALHOU` com
  `errorMessage`.
- Para arquivos acima de um limite (ex.: > 5k linhas), processar em
  **background** (fila simples in-process ou tabela de jobs), retornando o
  `importBatchId` na hora; o front acompanha o status por polling (a tela de
  histórico já lê status).

---

### NFR-3 — Custo do import escala com o arquivo, não com o histórico
**Meta:** tempo de import proporcional ao **tamanho do arquivo**, não ao total
de lançamentos já existentes na conta.

**Hoje:** `imports.service.ts:135-140` carrega **todos** os `dedupeHash`/`fitId`
da conta num `Set` a cada import. Cresce linear com o histórico.

**Abordagem:** confiar nas `@@unique([bankAccountId, dedupeHash])` /
`([bankAccountId, fitId])` + `createMany({ skipDuplicates: true })` (já
existem). Obter a contagem de duplicados pela diferença entre enviados e
inseridos (retorno do `createMany`) em vez do pré-check em memória. Dedupe
intra-arquivo continua num Set local (barato).

---

### NFR-4 — Latência de grid e classificação sob volume
**Meta:** listagem paginada do grid com **p95 < 300 ms** numa empresa com
500k lançamentos, nos filtros comuns; aplicação de regras num import de 20k
linhas em segundos, não minutos.

**Hoje:** índices cobrem `(companyId, competenceYear, competenceMonth)`,
`(companyId, status)`, `(companyId, categoryId)`, mas **falta `(companyId,
date)`** — e o sort padrão do grid é `date desc`. Regras fazem **N+1 UPDATE**
(`classification-rules.service.ts`, um update por transação).

**Abordagem:**
- Migration adicionando índice `(companyId, date)`.
- Trocar o loop de updates por `updateMany` agrupado por
  `(categoryId, partyId, appliedRuleId)`.
- Paginação por **keyset/cursor** (substituir `skip/take` profundo) — quando o
  volume justificar.

---

### NFR-5 — Ciclo de vida do dado histórico
**Meta:** poder **reverter uma importação** por completo; **fechar períodos**
(meses conciliados ficam somente-leitura, rejeitando reimport/edição);
integridade preservada.

**Hoje:** deletar um `ImportBatch` faz `SetNull` no `importBatchId` (órfã as
transações em vez de removê-las) — não há "desfazer import". Nada impede
reimportar/editar um mês já fechado. `rawContent` guarda o arquivo inteiro no
banco (`imports.service.ts:67`), inchando a tabela.

**Abordagem:**
- Endpoint "reverter importação": remove as transações do batch (respeitando o
  que já foi conciliado — decidir política) e o próprio batch, em `$transaction`.
- Conceito de **período fechado** (por empresa/conta): flag/tabela que bloqueia
  writes em meses fechados.
- Mover `rawContent` para storage de objeto (S3/R2) ou parar de persistir;
  manter só metadados no banco.

---

### NFR-6 — Auditoria e retenção (Fase 2 do roadmap)
**Meta:** toda mutação relevante registrada (quem, o quê, quando); política de
retenção definida.

**Hoje:** sem auditoria. Já previsto na Fase 2 do `CLAUDE.md`.

**Abordagem:** tabela de auditoria append-only + interceptor Nest nos writes de
domínio. Alinhar com o RBAC da Fase 2.

---

## Prioridade

| Prioridade | NFR | Motivo |
|---|---|---|
| 🔴 Agora | NFR-1 Export streaming | Único que derruba o processo (OOM) com dado real |
| 🔴 Agora | NFR-2 Import atômico + background | Backfill de anos quebra hoje; falha deixa lixo |
| 🟠 Próximo | NFR-3 Dedupe por constraint | Escala do import |
| 🟠 Próximo | NFR-4 Índice `(companyId,date)` + `updateMany` | Latência de grid e regras |
| 🟡 Depois | NFR-5 Reverter import / fechar período / rawContent | Regra de negócio e higiene |
| 🟡 Depois | NFR-6 Auditoria + retenção | Cresce junto com a Fase 2 |

## Como medir (antes de dar por pronto)

- **Seed de carga**: script que popula uma empresa com N lançamentos
  (50k / 200k / 500k) para medir export, grid e import de forma realista.
- **Export**: medir RSS de memória do processo durante o export de 200k linhas —
  deve ficar praticamente plano.
- **Import**: cronometrar import de 5k / 20k / 50k linhas; confirmar que dobrar
  o histórico não dobra o tempo (NFR-3).
- **Grid**: `EXPLAIN ANALYZE` das queries de listagem com 500k linhas.
