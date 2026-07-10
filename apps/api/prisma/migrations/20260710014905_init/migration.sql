-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDITO', 'DEBITO');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDENTE', 'CONCILIADO', 'IGNORADO', 'DUPLICADO');

-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('RECEITA', 'DESPESA', 'INVESTIMENTO', 'FINANCIAMENTO');

-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('CSV', 'OFX');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PROCESSANDO', 'CONCLUIDO', 'PARCIAL', 'FALHOU');

-- CreateEnum
CREATE TYPE "PartyKind" AS ENUM ('FORNECEDOR', 'CLIENTE', 'AMBOS');

-- CreateEnum
CREATE TYPE "RuleField" AS ENUM ('DESCRICAO', 'HISTORICO', 'DOCUMENTO');

-- CreateEnum
CREATE TYPE "RuleMatchType" AS ENUM ('CONTAINS', 'REGEX', 'EQUALS');

-- CreateEnum
CREATE TYPE "CategorySource" AS ENUM ('MANUAL', 'REGRA');

-- CreateEnum
CREATE TYPE "DFCLine" AS ENUM ('RECEBIMENTOS_CLIENTES', 'OUTRAS_RECEITAS', 'MATERIA_PRIMA', 'FOLHA', 'IMPOSTOS', 'SERVICOS', 'COMERCIAL', 'ADMINISTRATIVO', 'DESPESAS_FIXAS', 'APLICACOES', 'COMPRA_MAQUINAS', 'COMPRA_VEICULOS', 'IMOVEIS', 'VENDA_ATIVOS', 'EMPRESTIMOS', 'PARCELAMENTOS', 'CAPITAL', 'DIVIDENDOS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_companies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankCode" TEXT,
    "bankName" TEXT,
    "agencia" TEXT,
    "conta" TEXT NOT NULL,
    "contaDigito" TEXT,
    "apelido" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,
    "dfcLine" "DFCLine",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "kind" "PartyKind" NOT NULL DEFAULT 'AMBOS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PROCESSANDO',
    "parsedBankName" TEXT,
    "parsedAgencia" TEXT,
    "parsedConta" TEXT,
    "statementStartDate" DATE,
    "statementEndDate" DATE,
    "statementStartBalance" DECIMAL(14,2),
    "statementEndBalance" DECIMAL(14,2),
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "newRecords" INTEGER NOT NULL DEFAULT 0,
    "duplicateRecords" INTEGER NOT NULL DEFAULT 0,
    "ignoredRecords" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batch_periods" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "openingBalance" DECIMAL(14,2),
    "closingBalance" DECIMAL(14,2),

    CONSTRAINT "import_batch_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "importBatchId" TEXT,
    "date" DATE NOT NULL,
    "settlementDate" DATE,
    "description" TEXT NOT NULL,
    "historico" TEXT,
    "document" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "balanceAfter" DECIMAL(14,2),
    "competenceYear" INTEGER NOT NULL,
    "competenceMonth" INTEGER NOT NULL,
    "origin" "ImportSource" NOT NULL,
    "fitId" TEXT,
    "dedupeHash" TEXT NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDENTE',
    "categoryId" TEXT,
    "partyId" TEXT,
    "categorySource" "CategorySource",
    "appliedRuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "field" "RuleField" NOT NULL DEFAULT 'DESCRICAO',
    "matchType" "RuleMatchType" NOT NULL DEFAULT 'CONTAINS',
    "pattern" TEXT NOT NULL,
    "categoryId" TEXT,
    "partyId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "user_companies_userId_companyId_key" ON "user_companies"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_companyId_bankCode_agencia_conta_key" ON "bank_accounts"("companyId", "bankCode", "agencia", "conta");

-- CreateIndex
CREATE INDEX "categories_companyId_parentId_idx" ON "categories"("companyId", "parentId");

-- CreateIndex
CREATE INDEX "parties_companyId_name_idx" ON "parties"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "parties_companyId_document_key" ON "parties"("companyId", "document");

-- CreateIndex
CREATE UNIQUE INDEX "import_batch_periods_importBatchId_year_month_key" ON "import_batch_periods"("importBatchId", "year", "month");

-- CreateIndex
CREATE INDEX "transactions_companyId_competenceYear_competenceMonth_idx" ON "transactions"("companyId", "competenceYear", "competenceMonth");

-- CreateIndex
CREATE INDEX "transactions_companyId_status_idx" ON "transactions"("companyId", "status");

-- CreateIndex
CREATE INDEX "transactions_companyId_categoryId_idx" ON "transactions"("companyId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bankAccountId_fitId_key" ON "transactions"("bankAccountId", "fitId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bankAccountId_dedupeHash_key" ON "transactions"("bankAccountId", "dedupeHash");

-- CreateIndex
CREATE INDEX "classification_rules_companyId_isActive_priority_idx" ON "classification_rules"("companyId", "isActive", "priority");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parties" ADD CONSTRAINT "parties_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batch_periods" ADD CONSTRAINT "import_batch_periods_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_appliedRuleId_fkey" FOREIGN KEY ("appliedRuleId") REFERENCES "classification_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
