# Ordo — guia do projeto

Ordo é uma plataforma de conciliação bancária, classificação automática de
movimentações e geração de DFC (Demonstração do Fluxo de Caixa), com
integração futura a Power BI. Este arquivo documenta a arquitetura e o
roadmap de fases para orientar trabalho futuro no projeto.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
  + TanStack Table/Query + Recharts
- **Backend**: NestJS + TypeScript + Prisma
- **Banco**: PostgreSQL 16 (Docker Compose, porta local 55432)
- **Auth**: JWT de acesso (curto, em memória no client) + Refresh Token
  (cookie httpOnly, rotacionado a cada uso, com detecção de reuso)
- **Upload/parse**: CSV (heurística de colunas + tela de confirmação) e OFX
  (SGML 1.x normalizado + XML 2.x, via `fast-xml-parser`)

## Estrutura do monorepo

```
apps/api/src/modules/         Um módulo Nest por domínio:
  auth/                       register, login, refresh, logout, me
  companies/                  empresas do usuário
  bank-accounts/               contas bancárias
  categories/                  árvore de categorias, cada folha mapeada a uma DFCLine
  parties/                     fornecedores/clientes
  imports/                     upload CSV/OFX, parsers, dedupe, split por competência
  transactions/                 grid (list/bulk/update/export)
  classification-rules/        regras + motor de aplicação automática
  dfc/                          agregação da DFC + export
  dashboard/                    agregações para os gráficos

apps/web/
  app/(auth)/{login,register}
  app/(app)/{dashboard,lancamentos,importar,dfc,regras,cadastros}
  components/{ui,transactions,dfc,imports,dashboard,layout}
  lib/{api-client.ts, hooks/*, auth/*}

packages/shared/src/
  dfc-structure.ts    Única fonte de verdade da hierarquia do DFC (grupos →
                       seções → linhas) — usada por backend (agregação) e
                       frontend (pivot table, formulários de categoria)
  enums.ts, dto/*, validation/schemas.ts (zod)
```

`packages/shared` é publicado como pacote de workspace e precisa ser buildado
(`npm run build --workspace=packages/shared`) antes de `apps/api`/`apps/web`
enxergarem mudanças nele — `npm run dev` na raiz já cuida disso (roda o
`tsc --watch` do shared junto).

## Decisões de arquitetura que valem lembrar

- **Multiempresa no schema, não na UI ainda**: toda entidade transacional tem
  `companyId` direto. `UserCompany.role` é string livre (`"ADMIN"`) — vira
  RBAC completo na Fase 2, sem migração destrutiva.
- **Dedupe de importação**: `Transaction.dedupeHash` (sha256 de
  conta+data+valor+descrição normalizada) e `fitId` (OFX) com constraints
  únicas por `bankAccountId`. Colisão = a linha simplesmente não é reinserida
  (contabilizada como "duplicado" no resumo); o status `DUPLICADO` do enum
  fica disponível para o usuário marcar manualmente lançamentos que ele
  identifica como duplicados durante a conciliação — não é setado
  automaticamente pelo import.
- **Categoria → DFC**: `Category.dfcLine` é nulo em categorias-pai/agrupadoras
  e obrigatório nas folhas que efetivamente recebem lançamentos. Grupos,
  seções e subtotais do DFC são derivados em código a partir de
  `dfc-structure.ts`, não são linhas de banco.
- **Regras de classificação**: primeira regra ativa que bater (ordenadas por
  `priority desc, createdAt asc`) vence. Aplicadas automaticamente logo após
  cada importação (só nas transações recém-inseridas) e sob demanda via
  "Reaplicar em pendentes".
- **DFC saldo inicial/final**: é o acumulado do fluxo de caixa classificado
  dentro do ano selecionado, começando de zero — **não** é o saldo bancário
  real (que dependeria de snapshots de todas as contas através dos anos,
  fora do escopo do MVP). Isso está explícito na tela.
- **Refresh token**: nunca chame `/auth/refresh` diretamente de um efeito de
  componente — use o singleton `refreshAccessToken()` de `lib/api-client.ts`.
  Ele dedupe chamadas concorrentes; sem isso, o duplo-disparo de efeitos do
  `React.StrictMode` em dev pode disparar dois refreshes simultâneos, o
  segundo usando um token já rotacionado pelo primeiro, acionando a
  detecção de reuso e derrubando a sessão inteira.

## Comandos

Veja `README.md` para o passo a passo completo de setup local. Resumo:

```bash
npm install
npm run docker:up
npm run prisma:migrate --workspace=apps/api
npm run prisma:seed --workspace=apps/api
npm run dev
npm --workspace=apps/api run test   # testes dos parsers, motor de regras e agregação DFC
```

**Nunca rode `next build` enquanto `next dev` está ativo na mesma pasta** —
corrompe o `.next` do dev server (sintoma: 404 em `_next/static/*`). Pare o
dev server, rode o build, e se for continuar em dev, apague `apps/web/.next`
e reinicie o `npm run dev`.

## Roadmap de fases

### Fase 1 — MVP (concluída)

Import CSV/OFX → grid de lançamentos com filtros/bulk actions → regras de
classificação simples → DFC em tabela dinâmica → dashboard básico → export
CSV/Excel. Auth com JWT+refresh. Cadastros de empresas, contas, categorias,
fornecedores/clientes.

### Fase 2 — Inteligência e controle de acesso

- Motor de IA de sugestão por similaridade (descrição/CNPJ/PIX/valor
  parecidos) — schema já preparado (`categorySource`, `appliedRuleId`)
- Import de XLSX
- Auditoria completa (quem alterou o quê, quando) + versionamento de regras
  e categorias
- Multiempresa com perfis de permissão granulares (RBAC completo,
  substituindo o `role` string livre em `UserCompany`)
- Centro de custo e Projeto como dimensões de filtro e classificação

### Fase 3 — Colaboração e produtividade

- Anexos por lançamento (NF, boletos, comprovantes)
- Comentários internos por lançamento
- Tags/etiquetas personalizadas
- Alertas de lançamentos atípicos (valores fora do padrão histórico)
- Export em PDF
- API pública documentada com chaves de API

### Fase 4 — Power BI / BI

- Views SQL em modelo estrela: Fato Movimentações + Dim Empresa, Categoria,
  Banco, Conta, Calendário, Centro de Custo, Projeto
- Documentação de conexão via Power BI (import e DirectQuery)

### Fase 5 — Dashboards avançados

- Waterfall, treemap, saldo diário/anual, top fornecedores/clientes
- Dashboard de qualidade da conciliação (% conciliado, pendências,
  inconsistências)
- Busca rápida global em todas as movimentações
