# Conciliação Bancária Inteligente (Ordo)

## O que o app faz

O Ordo ajuda uma empresa a entender para onde vai e de onde vem o seu
dinheiro, a partir dos extratos bancários que ela já tem.

1. **Importar extratos**: o usuário envia um arquivo CSV ou OFX de uma conta
   bancária. O sistema lê os lançamentos (data, descrição, valor) e os
   guarda, ignorando automaticamente qualquer lançamento que já tenha sido
   importado antes (mesma conta, mesma data, mesmo valor e mesma descrição —
   ou o mesmo identificador único do banco, no caso de OFX).
2. **Classificar cada lançamento**: cada lançamento pode ser associado a uma
   categoria (ex: "Matéria-Prima", "Recebimentos de Clientes") e,
   opcionalmente, a um fornecedor ou cliente. Isso pode ser feito à mão, ou
   automaticamente por meio de regras (ex: "toda descrição que contenha
   'ENERGISA' vai para a categoria Despesas Fixas"). A primeira regra ativa
   que bater com o lançamento vence.
3. **Conciliar**: o usuário revisa a lista de lançamentos e marca o status de
   cada um (pendente, conciliado, ignorado ou duplicado manualmente
   identificado).
4. **Gerar a DFC**: com os lançamentos classificados, o sistema monta a
   Demonstração do Fluxo de Caixa do ano — agrupando os valores nas três
   grandes áreas contábeis (Operacional, Investimento, Financiamento) e
   mostrando a evolução mês a mês.
5. **Visualizar no dashboard**: gráficos resumindo entradas, saídas e saldo
   ao longo do tempo.

Multiempresa: um usuário pode ter acesso a mais de uma empresa, e todos os
dados (contas, categorias, lançamentos, regras) pertencem a uma empresa
específica.

## Definição das entidades

Campos técnicos internos (ids, timestamps de auditoria `createdAt`/
`updatedAt`) foram omitidos abaixo por serem óbvios; o foco é o que cada
campo significa e se ele é **armazenado** (vem de uma ação do usuário ou do
arquivo importado) ou **derivado** (calculado a partir de outros dados,
nunca editado diretamente).

### Empresa (`Company`)
Uma empresa/CNPJ para a qual o usuário conciliará movimentações. Todo dado
transacional (contas, categorias, lançamentos, regras, importações) pertence
a exatamente uma empresa.
- **Armazenados**: nome, CNPJ (opcional).

### Usuário e vínculo com empresa (`User`, `UserCompany`)
Um usuário pode acessar várias empresas. `UserCompany.role` é hoje um texto
livre (`"ADMIN"`); vira controle de permissões completo na Fase 2. O login pode
ser por e-mail/senha ou por Google; a mesma pessoa pode ter os dois (a senha
fica nula em contas criadas só via Google). Um login Google com e-mail
verificado que já existe é vinculado à conta existente.
- **Armazenados**: nome, e-mail, senha com hash (opcional — nula em contas
  só-Google), `googleId` (opcional, único), avatar (opcional), e por vínculo:
  papel na empresa.

### Conta bancária (`BankAccount`)
Uma conta bancária da empresa, para a qual os extratos são importados.
- **Armazenados**: banco, agência, conta e dígito, apelido, se está ativa.

### Categoria (`Category`)
Uma árvore de categorias usada para classificar lançamentos. Categorias-pai
apenas agrupam (ex: "Despesas Operacionais"); só as categorias-folha recebem
lançamentos e precisam estar mapeadas a uma linha da DFC.
- **Armazenados**: nome, tipo (Receita, Despesa, Investimento,
  Financiamento), categoria-pai (opcional), linha da DFC (obrigatória em
  folhas, nula em categorias-pai), se está ativa.
- **Derivados**: os grupos, seções e subtotais da DFC não são categorias —
  são calculados a partir do mapeamento categoria → linha da DFC (ver
  `packages/shared/src/dfc-structure.ts`).

### Fornecedor/Cliente (`Party`)
Uma pessoa ou empresa com quem a empresa transaciona.
- **Armazenados**: nome, documento (CNPJ/CPF, opcional e único por empresa),
  tipo (Fornecedor, Cliente ou Ambos).

### Importação de extrato (`ImportBatch` e `ImportBatchPeriod`)
Registro de um upload de arquivo (CSV ou OFX) para uma conta bancária,
guardado junto com o conteúdo bruto do arquivo para auditoria.
- **Armazenados**: origem (CSV/OFX), nome e conteúdo original do arquivo,
  banco/agência/conta identificados no arquivo, data e saldo de
  abertura/fechamento informados pelo extrato.
- **Derivados**: status da importação (processando/concluído/parcial/
  falhou); contagem de lançamentos totais, novos, duplicados e ignorados;
  por período (ano/mês) dentro do arquivo, a contagem de lançamentos e os
  saldos de abertura/fechamento daquele período — tudo calculado a partir
  dos lançamentos efetivamente inseridos, não editável pelo usuário.

### Lançamento (`Transaction`)
Uma movimentação bancária — o núcleo do sistema. Cada linha de extrato vira
um lançamento.
- **Armazenados** (vindos do arquivo importado): data, data de liquidação
  (quando informada), descrição, histórico e documento (quando informados),
  valor (positivo para crédito, negativo para débito), tipo
  (crédito/débito), saldo após o lançamento (quando informado pelo extrato),
  origem (CSV/OFX), identificador único do banco (`fitId`, só em OFX).
- **Armazenados** (vindos de ação do usuário ou do motor de regras):
  categoria, fornecedor/cliente, status de conciliação (pendente,
  conciliado, ignorado, duplicado), origem da classificação (manual ou por
  regra) e qual regra foi aplicada.
- **Derivados**: ano e mês de competência (extraídos da data do lançamento);
  hash de deduplicação (calculado a partir de conta + data + valor +
  descrição normalizada, usado para não reinserir o mesmo lançamento em
  importações futuras).

### Regra de classificação (`ClassificationRule`)
Uma regra que classifica lançamentos automaticamente. Todas as regras ativas
de uma empresa são avaliadas em ordem de prioridade (maior primeiro,
desempate pela mais antiga); a primeira que bater define categoria e/ou
fornecedor/cliente do lançamento. Aplicadas automaticamente logo após cada
importação (apenas nos lançamentos recém-inseridos) e sob demanda pelo
usuário ("Reaplicar em pendentes").
- **Armazenados**: nome, campo do lançamento a comparar (descrição,
  histórico ou documento), tipo de comparação (contém, regex, igual),
  padrão de busca, categoria e/ou fornecedor/cliente a aplicar quando bate,
  prioridade, se está ativa.

### DFC (Demonstração do Fluxo de Caixa)
**Não é uma entidade armazenada** — é inteiramente derivada, calculada sob
demanda a partir dos lançamentos classificados de um ano. Cada lançamento
soma seu valor na linha da DFC mapeada pela sua categoria; grupos, seções e
subtotais (Operacional, Investimento, Financiamento) são somas dessas
linhas, definidas em código em `packages/shared/src/dfc-structure.ts`. O
saldo inicial/final mostrado é o acumulado do fluxo de caixa classificado
dentro do ano selecionado, começando de zero — **não** é o saldo bancário
real da conta (que exigiria snapshots de todas as contas ao longo dos anos,
fora do escopo do MVP). Isso é indicado explicitamente na tela.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + TanStack Table/Query + Recharts
- **Backend**: NestJS + TypeScript + Prisma
- **Banco**: PostgreSQL (via Docker Compose)
- **Auth**: e-mail/senha ou Google (OAuth); JWT (access token em memória) + Refresh Token (cookie httpOnly, rotacionado)

## Como rodar a aplicação (passo a passo)

### Pré-requisitos

- **Node 20 ou superior** — confira com `node -v`. (Recomendado instalar via
  [nvm](https://github.com/nvm-sh/nvm).)
- **Docker Desktop** instalado e **aberto/rodando** (é ele que sobe o banco de
  dados). Confira com `docker ps`.
- **Git** para clonar o repositório.

### Passo 1 — Clonar e instalar as dependências

Na raiz do projeto (o monorepo tem `apps/api`, `apps/web` e `packages/shared`):

```bash
npm install
```

Isso instala tudo de uma vez (um único `node_modules` na raiz).

### Passo 2 — Subir o banco de dados

```bash
npm run docker:up
```

Sobe um PostgreSQL num container, na porta **55432** (proposital, para não
conflitar com um Postgres nativo na 5432). Aguarde alguns segundos até ficar
saudável — confira com `docker ps` (deve aparecer `conciliacao-postgres`).

### Passo 3 — Configurar as variáveis de ambiente

```bash
# API: copia o exemplo com todos os segredos e a URL do banco
cp .env.example apps/api/.env

# Web: diz ao front onde a API está
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > apps/web/.env.local
```

O `.env.example` já vem com valores de desenvolvimento que funcionam localmente.
> A API **recusa subir** se faltar `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
> `DATABASE_URL` ou `CORS_ORIGIN` — por isso não pule este passo.

### Passo 4 — Criar as tabelas e os dados de exemplo

```bash
npm run prisma:migrate   # cria as tabelas no banco
npm run prisma:seed      # cria a empresa demo + árvore de categorias do DFC
```

### Passo 5 — Subir a aplicação (API + Web juntos)

```bash
npm run dev
```

Isso sobe, em paralelo: o build do `packages/shared` em modo watch, a **API**
(porta 3001) e o **Web** (porta 3000). Deixe esse terminal aberto.

### Passo 6 — Acessar e entrar

1. Abra **http://localhost:3000** no navegador.
2. Faça login com o usuário demo criado pelo seed:
   - **E-mail**: `demo@conciliacao.dev`
   - **Senha**: `demo12345`

Esse usuário já vem vinculado à "Empresa Demo Ltda", com uma conta bancária e o
plano de categorias padrão mapeado ao DFC — então dá para importar um extrato e
ver a DFC/dashboard funcionando na hora.

### Conferindo que está tudo no ar

| Serviço | URL | Observação |
|---|---|---|
| Web (app) | http://localhost:3000 | onde você usa o sistema |
| API | http://localhost:3001/health | deve responder `{ "status": "ok" }` |
| pgAdmin | http://localhost:5050 | banco pelo navegador (`admin@conciliacao.dev` / `admin`) |

### (Opcional) Habilitar login com Google localmente

O login por e-mail/senha funciona sem nenhuma configuração extra. Para testar o
**"Continuar com Google"** localmente, preencha no `apps/api/.env`:

```
GOOGLE_CLIENT_ID="..."         # do Google Cloud Console
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:3001/auth/google/callback"
WEB_APP_URL="http://localhost:3000"
```

No Google Cloud Console, cadastre `http://localhost:3001/auth/google/callback`
como **Authorized redirect URI**. Depois de mexer no `.env`, **reinicie o
`npm run dev`** (a API só lê as variáveis no boot).

### Problemas comuns

- **`docker ps` não funciona / banco não sobe** → o Docker Desktop não está
  aberto. Abra-o e rode `npm run docker:up` de novo.
- **API não sobe com erro de variável faltando** → você pulou o Passo 3
  (`cp .env.example apps/api/.env`).
- **Porta 3000 ou 3001 ocupada** → feche o processo antigo (outra instância do
  `npm run dev`) antes de subir de novo.
- **404 em `_next/static/...` no front** → o `.next` do dev foi corrompido por um
  build de produção rodado junto. Pare o dev, apague `apps/web/.next` e rode
  `npm run dev` de novo (ver o aviso em "Comandos úteis").

## Comandos úteis

```bash
npm run build              # build de shared, api e web, nessa ordem
npm run docker:down         # para os containers
npm --workspace=apps/api run prisma:studio   # inspecionar o banco visualmente
npm --workspace=apps/api run test            # testes unitários (parsers, motor de regras, DFC)
```

**Atenção**: nunca rode `npm run build --workspace=apps/web` enquanto o
`next dev` da mesma pasta está ativo — o build de produção sobrescreve o
`.next` usado pelo servidor de dev e quebra o hot reload (sintoma: 404 em
`_next/static/...`). Se acontecer, pare o dev server, apague `apps/web/.next`
e rode `npm run dev` de novo.

## Deploy (Railway + Vercel)

### API — Railway

Configure um serviço Railway apontando para este repositório (`apps/api` como
root). **Passo de release** (Railway → Settings → Deploy): `npm run prisma:deploy`.

Variáveis de ambiente obrigatórias no serviço Railway:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (Railway Postgres plugin) |
| `JWT_ACCESS_SECRET` | Secret do access token (gere com `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Secret do refresh token (gere com `openssl rand -hex 32`) |
| `CORS_ORIGIN` | URL do app Vercel (ex: `https://ordo.vercel.app`) |
| `NODE_ENV` | `production` |
| `GOOGLE_CLIENT_ID` | Client ID do Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret do Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://<railway-domain>/auth/google/callback` |
| `WEB_APP_URL` | URL do app Vercel (para redirect pós-OAuth) |

`API_PORT` é opcional — Railway injeta a porta via `$PORT` automaticamente;
defina apenas se precisar substituir.

### Web — Vercel

Conecte o repositório ao Vercel. Configure:

- **Root Directory**: `apps/web`
- **Framework Preset**: Next.js

Variável de ambiente:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública da API Railway (ex: `https://api.railway.app`) |

O domínio do Vercel precisa estar registrado no Google Cloud Console como
`Authorized redirect URI` do OAuth client.

## Estrutura do monorepo

```
apps/api        NestJS — todos os módulos de domínio em src/modules/*
apps/web        Next.js App Router — páginas em app/(auth) e app/(app)
packages/shared Enums, DTOs, validação (zod) e a hierarquia do DFC — fonte
                única de verdade usada por backend e frontend
```
