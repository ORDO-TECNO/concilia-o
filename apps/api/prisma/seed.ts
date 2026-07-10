import { PrismaClient, CategoryKind, DFCLine } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface CategorySeed {
  name: string;
  kind: CategoryKind;
  dfcLine?: DFCLine;
  children?: CategorySeed[];
}

const CATEGORY_TREE: CategorySeed[] = [
  {
    name: 'Receita Operacional',
    kind: CategoryKind.RECEITA,
    children: [
      { name: 'Recebimento de Clientes', kind: CategoryKind.RECEITA, dfcLine: DFCLine.RECEBIMENTOS_CLIENTES },
      { name: 'Outras Receitas', kind: CategoryKind.RECEITA, dfcLine: DFCLine.OUTRAS_RECEITAS },
    ],
  },
  {
    name: 'Despesas Operacionais',
    kind: CategoryKind.DESPESA,
    children: [
      { name: 'Matéria-Prima', kind: CategoryKind.DESPESA, dfcLine: DFCLine.MATERIA_PRIMA },
      { name: 'Folha de Pagamento', kind: CategoryKind.DESPESA, dfcLine: DFCLine.FOLHA },
      { name: 'Impostos', kind: CategoryKind.DESPESA, dfcLine: DFCLine.IMPOSTOS },
      {
        name: 'Serviços de Terceiros',
        kind: CategoryKind.DESPESA,
        dfcLine: DFCLine.SERVICOS,
      },
      {
        name: 'Comercial',
        kind: CategoryKind.DESPESA,
        dfcLine: DFCLine.COMERCIAL,
        children: [
          { name: 'Marketing', kind: CategoryKind.DESPESA, dfcLine: DFCLine.COMERCIAL },
          { name: 'Frete', kind: CategoryKind.DESPESA, dfcLine: DFCLine.COMERCIAL },
        ],
      },
      {
        name: 'Administrativo',
        kind: CategoryKind.DESPESA,
        dfcLine: DFCLine.ADMINISTRATIVO,
      },
      {
        name: 'Despesas Fixas',
        kind: CategoryKind.DESPESA,
        dfcLine: DFCLine.DESPESAS_FIXAS,
        children: [
          { name: 'Aluguel', kind: CategoryKind.DESPESA, dfcLine: DFCLine.DESPESAS_FIXAS },
          { name: 'Energia', kind: CategoryKind.DESPESA, dfcLine: DFCLine.DESPESAS_FIXAS },
          { name: 'Internet', kind: CategoryKind.DESPESA, dfcLine: DFCLine.DESPESAS_FIXAS },
        ],
      },
    ],
  },
  {
    name: 'Investimentos',
    kind: CategoryKind.INVESTIMENTO,
    children: [
      { name: 'Aplicações Financeiras', kind: CategoryKind.INVESTIMENTO, dfcLine: DFCLine.APLICACOES },
      { name: 'Resgates / Venda de Ativos', kind: CategoryKind.INVESTIMENTO, dfcLine: DFCLine.VENDA_ATIVOS },
      { name: 'Compra de Máquinas', kind: CategoryKind.INVESTIMENTO, dfcLine: DFCLine.COMPRA_MAQUINAS },
      { name: 'Veículos', kind: CategoryKind.INVESTIMENTO, dfcLine: DFCLine.COMPRA_VEICULOS },
      { name: 'Imóveis', kind: CategoryKind.INVESTIMENTO, dfcLine: DFCLine.IMOVEIS },
    ],
  },
  {
    name: 'Financiamentos',
    kind: CategoryKind.FINANCIAMENTO,
    children: [
      { name: 'Empréstimos / Antecipação', kind: CategoryKind.FINANCIAMENTO, dfcLine: DFCLine.EMPRESTIMOS },
      {
        name: 'Parcelas, Juros e Amortização',
        kind: CategoryKind.FINANCIAMENTO,
        dfcLine: DFCLine.PARCELAMENTOS,
      },
      { name: 'Capital Social', kind: CategoryKind.FINANCIAMENTO, dfcLine: DFCLine.CAPITAL },
      { name: 'Dividendos', kind: CategoryKind.FINANCIAMENTO, dfcLine: DFCLine.DIVIDENDOS },
    ],
  },
];

async function createCategoryTree(companyId: string, nodes: CategorySeed[], parentId: string | null) {
  for (const node of nodes) {
    const created = await prisma.category.create({
      data: {
        companyId,
        parentId,
        name: node.name,
        kind: node.kind,
        dfcLine: node.dfcLine ?? null,
      },
    });
    if (node.children?.length) {
      await createCategoryTree(companyId, node.children, created.id);
    }
  }
}

async function main() {
  const passwordHash = await bcrypt.hash('demo12345', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@conciliacao.dev' },
    update: {},
    create: {
      name: 'Usuário Demo',
      email: 'demo@conciliacao.dev',
      passwordHash,
    },
  });

  const company = await prisma.company.upsert({
    where: { cnpj: '00000000000191' },
    update: {},
    create: {
      name: 'Empresa Demo Ltda',
      cnpj: '00000000000191',
    },
  });

  await prisma.userCompany.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    update: {},
    create: { userId: user.id, companyId: company.id, role: 'ADMIN' },
  });

  await prisma.bankAccount.upsert({
    where: {
      companyId_bankCode_agencia_conta: {
        companyId: company.id,
        bankCode: '341',
        agencia: '0001',
        conta: '12345-6',
      },
    },
    update: {},
    create: {
      companyId: company.id,
      bankCode: '341',
      bankName: 'Itaú Unibanco',
      agencia: '0001',
      conta: '12345-6',
      contaDigito: '6',
      apelido: 'Conta Principal',
    },
  });

  const existingCategories = await prisma.category.count({ where: { companyId: company.id } });
  if (existingCategories === 0) {
    await createCategoryTree(company.id, CATEGORY_TREE, null);
  }

  // eslint-disable-next-line no-console
  console.log('Seed concluído:', { userEmail: user.email, companyId: company.id });
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
