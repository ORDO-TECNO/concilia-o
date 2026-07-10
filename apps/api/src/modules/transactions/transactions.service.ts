import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CategorySource, Prisma, ReconciliationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertUserBelongsToCompany } from '../../common/auth/company-membership';
import { ListTransactionsQueryDto } from './dto/list-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { BulkTransactionsDto } from './dto/bulk-transactions.dto';
import { ExportTransactionsQueryDto } from './dto/export-transactions.dto';
import { buildCsvBuffer, buildXlsxBuffer } from '../../common/export/table-export';
import { formatDateBR } from '@conciliacao/shared';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(companyId: string, query: ListTransactionsQueryDto): Prisma.TransactionWhereInput {
    return {
      companyId,
      ...(query.bankAccountId ? { bankAccountId: query.bankAccountId } : {}),
      ...(query.year ? { competenceYear: query.year } : {}),
      ...(query.month ? { competenceMonth: query.month } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.partyId ? { partyId: query.partyId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: 'insensitive' } },
              { historico: { contains: query.search, mode: 'insensitive' } },
              { document: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  async list(companyId: string, query: ListTransactionsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where = this.buildWhere(companyId, query);

    const sortBy = query.sortBy ?? 'date';
    const sortDir = query.sortDir ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { category: true, party: true },
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: items.map((t) => this.toDto(t)),
      total,
      page,
      pageSize,
    };
  }

  async export(companyId: string, query: ExportTransactionsQueryDto): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const where = this.buildWhere(companyId, query);
    const sortBy = query.sortBy ?? 'date';
    const sortDir = query.sortDir ?? 'desc';

    const items = await this.prisma.transaction.findMany({
      where,
      include: { category: true, party: true, bankAccount: true },
      orderBy: { [sortBy]: sortDir },
    });

    const headers = [
      'Data',
      'Descrição',
      'Histórico',
      'Documento',
      'Valor',
      'Tipo',
      'Categoria',
      'Fornecedor/Cliente',
      'Status',
      'Conta',
      'Competência',
    ];

    const rows = items.map((t) => [
      formatDateBR(t.date.toISOString().slice(0, 10)),
      t.description,
      t.historico ?? '',
      t.document ?? '',
      Number(t.amount),
      t.type,
      t.category?.name ?? '',
      t.party?.name ?? '',
      t.status,
      t.bankAccount.apelido ?? t.bankAccount.conta,
      `${String(t.competenceMonth).padStart(2, '0')}/${t.competenceYear}`,
    ]);

    const format = query.format ?? 'csv';
    if (format === 'xlsx') {
      const buffer = await buildXlsxBuffer(headers, rows, 'Lançamentos');
      return {
        buffer,
        filename: `lancamentos-${Date.now()}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const buffer = await buildCsvBuffer(headers, rows);
    return { buffer, filename: `lancamentos-${Date.now()}.csv`, contentType: 'text/csv; charset=utf-8' };
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException('Lançamento não encontrado');
    await assertUserBelongsToCompany(this.prisma, userId, transaction.companyId);

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined
          ? { categoryId: dto.categoryId, categorySource: CategorySource.MANUAL, appliedRuleId: null }
          : {}),
        ...(dto.partyId !== undefined ? { partyId: dto.partyId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: { category: true, party: true },
    });

    return this.toDto(updated);
  }

  async bulk(userId: string, companyId: string, dto: BulkTransactionsDto) {
    const transactions = await this.prisma.transaction.findMany({
      where: { id: { in: dto.ids } },
      select: { id: true, companyId: true },
    });

    if (transactions.length !== dto.ids.length) {
      throw new BadRequestException('Alguns lançamentos não foram encontrados');
    }
    if (transactions.some((t) => t.companyId !== companyId)) {
      throw new BadRequestException('Lançamentos pertencem a outra empresa');
    }
    await assertUserBelongsToCompany(this.prisma, userId, companyId);

    switch (dto.action) {
      case 'CONCILIAR':
        await this.prisma.transaction.updateMany({
          where: { id: { in: dto.ids } },
          data: { status: ReconciliationStatus.CONCILIADO },
        });
        break;
      case 'IGNORAR':
        await this.prisma.transaction.updateMany({
          where: { id: { in: dto.ids } },
          data: { status: ReconciliationStatus.IGNORADO },
        });
        break;
      case 'EXCLUIR':
        await this.prisma.transaction.deleteMany({ where: { id: { in: dto.ids } } });
        break;
      case 'CATEGORIZAR':
        if (!dto.categoryId) {
          throw new BadRequestException('categoryId é obrigatório para a ação CATEGORIZAR');
        }
        await this.prisma.transaction.updateMany({
          where: { id: { in: dto.ids } },
          data: {
            categoryId: dto.categoryId,
            categorySource: CategorySource.MANUAL,
            appliedRuleId: null,
          },
        });
        break;
    }

    return { success: true, affected: dto.ids.length };
  }

  private toDto(t: Prisma.TransactionGetPayload<{ include: { category: true; party: true } }>) {
    return {
      id: t.id,
      companyId: t.companyId,
      bankAccountId: t.bankAccountId,
      importBatchId: t.importBatchId,
      date: t.date.toISOString().slice(0, 10),
      settlementDate: t.settlementDate ? t.settlementDate.toISOString().slice(0, 10) : null,
      description: t.description,
      historico: t.historico,
      document: t.document,
      amount: t.amount.toString(),
      type: t.type,
      balanceAfter: t.balanceAfter ? t.balanceAfter.toString() : null,
      competenceYear: t.competenceYear,
      competenceMonth: t.competenceMonth,
      origin: t.origin,
      status: t.status,
      categoryId: t.categoryId,
      categoryName: t.category?.name ?? null,
      partyId: t.partyId,
      partyName: t.party?.name ?? null,
      categorySource: t.categorySource,
    };
  }
}
