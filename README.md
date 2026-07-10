# Conciliação Bancária Inteligente

Plataforma de conciliação bancária, classificação automática de movimentações
e geração de DFC (Demonstração do Fluxo de Caixa). Veja `CLAUDE.md` para a
arquitetura completa e o roadmap de fases.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + TanStack Table/Query + Recharts
- **Backend**: NestJS + TypeScript + Prisma
- **Banco**: PostgreSQL (via Docker Compose)
- **Auth**: JWT (access token em memória) + Refresh Token (cookie httpOnly, rotacionado)

## Setup local

Pré-requisitos: Node 20+, Docker Desktop.

```bash
# 1. Instalar dependências (na raiz do monorepo)
npm install

# 2. Subir o Postgres (porta 55432, para não conflitar com um Postgres nativo na 5432)
npm run docker:up

# 3. Configurar variáveis de ambiente
cp .env.example apps/api/.env
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > apps/web/.env.local

# 4. Rodar a migração e o seed (empresa demo + árvore de categorias)
npm run prisma:migrate
npm run prisma:seed

# 5. Subir API + Web em modo dev
npm run dev
```

- API: http://localhost:3001 (health check em `/health`)
- Web: http://localhost:3000
- pgAdmin: http://localhost:5050 (login `admin@conciliacao.dev` / `admin`)

Usuário demo (criado pelo seed): `demo@conciliacao.dev` / `demo12345`, já vinculado
à "Empresa Demo Ltda" com uma conta bancária e o plano de categorias padrão
mapeado ao DFC.

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

## Estrutura do monorepo

```
apps/api        NestJS — todos os módulos de domínio em src/modules/*
apps/web        Next.js App Router — páginas em app/(auth) e app/(app)
packages/shared Enums, DTOs, validação (zod) e a hierarquia do DFC — fonte
                única de verdade usada por backend e frontend
```
