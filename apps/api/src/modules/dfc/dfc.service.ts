import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DFC_STRUCTURE, MONTH_LABELS } from '@conciliacao/shared';
import { buildCsvBuffer, buildXlsxBuffer } from '../../common/export/table-export';

function emptyMonths(): number[] {
  return Array(12).fill(0);
}

function sumArrays(arrays: number[][]): number[] {
  const result = emptyMonths();
  for (const arr of arrays) {
    for (let i = 0; i < 12; i++) result[i] += arr[i];
  }
  return result;
}

function total(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

@Injectable()
export class DfcService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(companyId: string, year: number) {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'competenceMonth'],
      where: { companyId, competenceYear: year, categoryId: { not: null } },
      _sum: { amount: true },
    });

    const categoryIds = [...new Set(grouped.map((g) => g.categoryId).filter(Boolean))] as string[];
    const categories = await this.prisma.category.findMany({ where: { id: { in: categoryIds } } });
    const categoryDfcLine = new Map(categories.map((c) => [c.id, c.dfcLine]));

    const lineTotals = new Map<string, number[]>();
    for (const g of grouped) {
      const dfcLine = g.categoryId ? categoryDfcLine.get(g.categoryId) : null;
      if (!dfcLine) continue;
      if (!lineTotals.has(dfcLine)) lineTotals.set(dfcLine, emptyMonths());
      lineTotals.get(dfcLine)![g.competenceMonth - 1] += Number(g._sum.amount ?? 0);
    }

    const groups = DFC_STRUCTURE.map((groupDef) => {
      const sections = groupDef.sections.map((sectionDef) => {
        const lines = sectionDef.lines.map((lineDef) => {
          const monthly = lineTotals.get(lineDef.line) ?? emptyMonths();
          return { line: lineDef.line, label: lineDef.label, monthly, total: total(monthly) };
        });
        const monthly = sumArrays(lines.map((l) => l.monthly));
        return { key: sectionDef.key, label: sectionDef.label, lines, monthly, total: total(monthly) };
      });
      const monthly = sumArrays(sections.map((s) => s.monthly));
      return {
        key: groupDef.key,
        label: groupDef.label,
        resultLabel: groupDef.resultLabel,
        sections,
        monthly,
        total: total(monthly),
      };
    });

    const netFlow = sumArrays(groups.map((g) => g.monthly));

    // Saldo acumulado a partir de 0 no início do ano selecionado (não é o saldo
    // bancário real — esse depende de snapshots de múltiplas contas/anos
    // anteriores, fora do escopo do MVP). Deixado explícito no frontend.
    const openingBalance = emptyMonths();
    const closingBalance = emptyMonths();
    let running = 0;
    for (let i = 0; i < 12; i++) {
      openingBalance[i] = running;
      running += netFlow[i];
      closingBalance[i] = running;
    }

    return {
      companyId,
      year,
      groups,
      openingBalance,
      closingBalance,
      netFlow,
    };
  }

  async exportReport(
    companyId: string,
    year: number,
    format: 'csv' | 'xlsx',
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const report = await this.getReport(companyId, year);
    const headers = ['Linha', ...MONTH_LABELS.map((m) => m.slice(0, 3)), 'Total'];
    const rows: (string | number)[][] = [];

    rows.push(['Saldo Inicial', ...report.openingBalance, report.openingBalance[0]]);

    for (const group of report.groups) {
      rows.push([group.label.toUpperCase(), ...group.monthly, group.total]);
      for (const section of group.sections) {
        rows.push([`  ${section.label}`, ...section.monthly, section.total]);
        for (const line of section.lines) {
          rows.push([`    ${line.label}`, ...line.monthly, line.total]);
        }
      }
      rows.push([group.resultLabel, ...group.monthly, group.total]);
    }

    rows.push(['Fluxo Líquido', ...report.netFlow, report.netFlow.reduce((a, b) => a + b, 0)]);
    rows.push(['Saldo Final', ...report.closingBalance, report.closingBalance[11]]);

    if (format === 'xlsx') {
      const buffer = await buildXlsxBuffer(headers, rows, `DFC ${year}`);
      return {
        buffer,
        filename: `dfc-${year}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const buffer = await buildCsvBuffer(headers, rows);
    return { buffer, filename: `dfc-${year}.csv`, contentType: 'text/csv; charset=utf-8' };
  }
}
