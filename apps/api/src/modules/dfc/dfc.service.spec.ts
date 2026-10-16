import { DfcService } from './dfc.service';
import { DFCLine } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface GroupByRow {
  categoryId: string | null;
  competenceMonth: number;
  _sum: { amount: number | null };
}

interface CategoryRow {
  id: string;
  dfcLine: DFCLine | null;
}

function buildPrismaMock(groupedResult: GroupByRow[], categories: CategoryRow[]): PrismaService {
  return {
    transaction: {
      groupBy: jest.fn().mockResolvedValue(groupedResult),
    },
    category: {
      findMany: jest.fn().mockResolvedValue(categories),
    },
  } as unknown as PrismaService;
}

describe('DfcService', () => {
  it('agrega valores por linha do DFC e monta grupos/seções/subtotais', async () => {
    const prisma = buildPrismaMock(
      [
        { categoryId: 'cat-receita', competenceMonth: 5, _sum: { amount: 1500 } },
        { categoryId: 'cat-materia-prima', competenceMonth: 5, _sum: { amount: -320.5 } },
        { categoryId: 'cat-materia-prima', competenceMonth: 6, _sum: { amount: -100 } },
      ],
      [
        { id: 'cat-receita', dfcLine: DFCLine.RECEBIMENTOS_CLIENTES },
        { id: 'cat-materia-prima', dfcLine: DFCLine.MATERIA_PRIMA },
      ],
    );

    const service = new DfcService(prisma);
    const report = await service.getReport('company-1', 2026);

    const operacional = report.groups.find((g) => g.key === 'OPERACIONAL')!;
    const entradas = operacional.sections.find((s) => s.key === 'ENTRADAS')!;
    const saidas = operacional.sections.find((s) => s.key === 'SAIDAS')!;

    expect(entradas.lines.find((l) => l.line === 'RECEBIMENTOS_CLIENTES')!.monthly[4]).toBe(1500);
    expect(saidas.lines.find((l) => l.line === 'MATERIA_PRIMA')!.monthly[4]).toBe(-320.5);
    expect(saidas.lines.find((l) => l.line === 'MATERIA_PRIMA')!.monthly[5]).toBe(-100);

    // Resultado Operacional (maio) = 1500 - 320.5 = 1179.5
    expect(operacional.monthly[4]).toBeCloseTo(1179.5);
    expect(operacional.monthly[5]).toBeCloseTo(-100);

    // Grupos sem lançamento ficam zerados, não ausentes
    const investimento = report.groups.find((g) => g.key === 'INVESTIMENTO')!;
    expect(investimento.total).toBe(0);
  });

  it('ignora transações de categorias sem dfcLine (categorias-pai/agrupadoras)', async () => {
    const prisma = buildPrismaMock(
      [{ categoryId: 'cat-pai', competenceMonth: 1, _sum: { amount: 999 } }],
      [{ id: 'cat-pai', dfcLine: null }],
    );

    const service = new DfcService(prisma);
    const report = await service.getReport('company-1', 2026);
    const netFlowTotal = report.netFlow.reduce((a, b) => a + b, 0);
    expect(netFlowTotal).toBe(0);
  });

  it('calcula saldo acumulado (opening/closing) em cascata a partir de 0', async () => {
    const prisma = buildPrismaMock(
      [{ categoryId: 'cat-receita', competenceMonth: 2, _sum: { amount: 100 } }],
      [{ id: 'cat-receita', dfcLine: DFCLine.RECEBIMENTOS_CLIENTES }],
    );

    const service = new DfcService(prisma);
    const report = await service.getReport('company-1', 2026);

    expect(report.openingBalance[0]).toBe(0);
    expect(report.openingBalance[1]).toBe(0);
    expect(report.closingBalance[1]).toBe(100);
    expect(report.openingBalance[2]).toBe(100);
    expect(report.closingBalance[11]).toBe(100);
  });

  it('não soma lançamentos ignorados nem duplicados', async () => {
    const prisma = buildPrismaMock([], []);
    await new DfcService(prisma).getReport('company-1', 2026);
    expect(prisma.transaction.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { notIn: ['IGNORADO', 'DUPLICADO'] } }),
      }),
    );
  });

  it('arredonda somas ao centavo (sem lixo de ponto flutuante)', async () => {
    const prisma = buildPrismaMock(
      [
        { categoryId: 'cat-a', competenceMonth: 1, _sum: { amount: 0.1 } },
        { categoryId: 'cat-b', competenceMonth: 1, _sum: { amount: 0.2 } },
      ],
      [
        { id: 'cat-a', dfcLine: DFCLine.RECEBIMENTOS_CLIENTES },
        { id: 'cat-b', dfcLine: DFCLine.OUTRAS_RECEITAS },
      ],
    );
    const report = await new DfcService(prisma).getReport('company-1', 2026);
    expect(report.netFlow[0]).toBe(0.3);
    expect(report.closingBalance[11]).toBe(0.3);
  });

  it('separa o fluxo não classificado sem misturá-lo aos grupos nem aos saldos', async () => {
    const prisma = buildPrismaMock(
      [
        { categoryId: null, competenceMonth: 3, _sum: { amount: -80 } },
        { categoryId: 'cat-grupo', competenceMonth: 3, _sum: { amount: 20 } },
        { categoryId: 'cat-receita', competenceMonth: 3, _sum: { amount: 100 } },
      ],
      [
        { id: 'cat-grupo', dfcLine: null },
        { id: 'cat-receita', dfcLine: DFCLine.RECEBIMENTOS_CLIENTES },
      ],
    );
    const report = await new DfcService(prisma).getReport('company-1', 2026);
    expect(report.unclassified[2]).toBe(-60);
    expect(report.netFlow[2]).toBe(100);
    expect(report.closingBalance[11]).toBe(100);
  });

  it('export inclui a linha de não classificado após o saldo final', async () => {
    const prisma = buildPrismaMock([{ categoryId: null, competenceMonth: 1, _sum: { amount: -10 } }], []);
    const { buffer } = await new DfcService(prisma).exportReport('company-1', 2026, 'csv');
    const lines = buffer.toString('utf-8').trim().split(/\r?\n/);
    expect(lines[lines.length - 2]).toMatch(/^Saldo Final/);
    expect(lines[lines.length - 1]).toMatch(/^Não classificado \(fora da DFC\)[;,]-10/);
  });
});
