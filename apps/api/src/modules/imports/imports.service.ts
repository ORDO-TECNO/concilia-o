import { createHash, randomUUID } from 'crypto';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ImportSource, ImportStatus, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertUserBelongsToCompany } from '../../common/auth/company-membership';
import { ClassificationRulesService } from '../classification-rules/classification-rules.service';
import { decodeFileBuffer } from './decode-file';
import { parseOfxStatement } from './parsers/ofx-statement.parser';
import {
  detectDelimiter,
  parseCsvStatement,
  previewCsv,
  type CsvColumnMapping,
} from './parsers/csv-statement.parser';
import type { ParsedStatement, ParsedTransaction } from './parsers/statement-parser.types';
import { ImportRequestDto } from './dto/import-request.dto';

function normalizeDescription(description: string): string {
  return description.trim().toUpperCase().replace(/\s+/g, ' ');
}

function computeDedupeHash(bankAccountId: string, t: ParsedTransaction): string {
  return createHash('sha256')
    .update(`${bankAccountId}|${t.date}|${t.amount.toFixed(2)}|${normalizeDescription(t.description)}`)
    .digest('hex');
}

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly classificationRulesService: ClassificationRulesService,
  ) {}

  previewCsvFile(buffer: Buffer) {
    const content = decodeFileBuffer(buffer);
    const delimiter = detectDelimiter(content);
    const result = previewCsv(content, delimiter);
    return { ...result, delimiter, previewToken: 'stateless' };
  }

  async import(companyId: string, dto: ImportRequestDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const bankAccount = await this.prisma.bankAccount.findUnique({ where: { id: dto.bankAccountId } });
    if (!bankAccount || bankAccount.companyId !== companyId) {
      throw new BadRequestException('Conta bancária inválida para esta empresa');
    }

    const rawContent = decodeFileBuffer(file.buffer);
    const parsed = this.parseFile(dto, rawContent);

    if (parsed.transactions.length === 0) {
      throw new BadRequestException(
        'Nenhum lançamento reconhecido no arquivo. Verifique o mapeamento de colunas.',
      );
    }

    const importBatch = await this.prisma.importBatch.create({
      data: {
        companyId,
        bankAccountId: dto.bankAccountId,
        source: dto.source as ImportSource,
        originalFileName: file.originalname,
        rawContent,
        status: ImportStatus.PROCESSANDO,
        parsedBankName: parsed.bankName ?? bankAccount.bankName,
        parsedAgencia: parsed.agencia ?? bankAccount.agencia,
        parsedConta: parsed.conta ?? bankAccount.conta,
        statementStartDate: parsed.startDate ? new Date(parsed.startDate) : null,
        statementEndDate: parsed.endDate ? new Date(parsed.endDate) : null,
        statementStartBalance: parsed.startBalance ?? null,
        statementEndBalance: parsed.endBalance ?? null,
        totalRecords: parsed.transactions.length,
      },
    });

    let insertedIds: string[];
    let updated: Prisma.ImportBatchGetPayload<{ include: { periods: true } }>;

    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          const { newRecords, duplicateRecords, insertedIds: ids } = await this.insertTransactions(
            companyId,
            dto.bankAccountId,
            importBatch.id,
            dto.source as ImportSource,
            parsed.transactions,
            tx,
          );

          await this.createPeriods(importBatch.id, parsed.transactions, tx);

          const batch = await tx.importBatch.update({
            where: { id: importBatch.id },
            data: {
              status: ImportStatus.CONCLUIDO,
              newRecords,
              duplicateRecords,
            },
            include: { periods: true },
          });

          return { batch, ids };
        },
        { timeout: 30000 },
      );

      updated = result.batch;
      insertedIds = result.ids;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao importar';
      this.logger.error(`Import batch ${importBatch.id} failed: ${errorMessage}`);
      await this.prisma.importBatch.update({
        where: { id: importBatch.id },
        data: { status: ImportStatus.FALHOU, errorMessage },
      });
      throw err;
    }

    // Rule application runs after the transaction commits — it is re-runnable
    // ("Reaplicar em pendentes"), so keeping it outside avoids holding a long
    // transaction and avoids pulling the rules service into the tx client.
    if (insertedIds.length > 0) {
      await this.classificationRulesService.applyToTransactions(companyId, insertedIds);
    }

    return this.toSummary(updated);
  }

  private parseFile(dto: ImportRequestDto, rawContent: string): ParsedStatement {
    if (dto.source === 'OFX') {
      return parseOfxStatement(rawContent);
    }

    const delimiter = dto.delimiter || detectDelimiter(rawContent);
    if (!dto.dateColumn || !dto.descriptionColumn || !dto.amountColumn) {
      throw new BadRequestException('Mapeamento de colunas incompleto para importação CSV');
    }

    const mapping: CsvColumnMapping = {
      dateColumn: dto.dateColumn,
      descriptionColumn: dto.descriptionColumn,
      amountColumn: dto.amountColumn,
      documentColumn: dto.documentColumn,
      balanceColumn: dto.balanceColumn,
      creditDebitColumn: dto.creditDebitColumn,
      delimiter,
      dateFormat: dto.dateFormat ?? 'DD/MM/YYYY',
      decimalSeparator: dto.decimalSeparator ?? ',',
    };

    return parseCsvStatement(rawContent, mapping);
  }

  private async insertTransactions(
    companyId: string,
    bankAccountId: string,
    importBatchId: string,
    source: ImportSource,
    transactions: ParsedTransaction[],
    tx: Prisma.TransactionClient,
  ) {
    const existing = await tx.transaction.findMany({
      where: { bankAccountId },
      select: { fitId: true, dedupeHash: true },
    });
    const existingFitIds = new Set(existing.filter((e) => e.fitId).map((e) => e.fitId as string));
    const existingHashes = new Set(existing.map((e) => e.dedupeHash));
    const seenInBatch = new Set<string>();

    const toInsert: Prisma.TransactionCreateManyInput[] = [];
    let duplicateRecords = 0;

    for (const t of transactions) {
      const dedupeHash = computeDedupeHash(bankAccountId, t);
      const batchKey = t.fitId ?? dedupeHash;
      const isDuplicate =
        (t.fitId && existingFitIds.has(t.fitId)) ||
        existingHashes.has(dedupeHash) ||
        seenInBatch.has(batchKey);

      if (isDuplicate) {
        duplicateRecords++;
        continue;
      }
      seenInBatch.add(batchKey);

      const [year, month] = t.date.split('-').map(Number);

      toInsert.push({
        id: randomUUID(),
        companyId,
        bankAccountId,
        importBatchId,
        date: new Date(t.date),
        description: t.description,
        historico: t.historico ?? null,
        document: t.document ?? null,
        amount: t.amount,
        type: t.amount >= 0 ? TransactionType.CREDITO : TransactionType.DEBITO,
        balanceAfter: t.balanceAfter ?? null,
        competenceYear: year,
        competenceMonth: month,
        origin: source,
        fitId: t.fitId ?? null,
        dedupeHash,
      });
    }

    if (toInsert.length > 0) {
      await tx.transaction.createMany({ data: toInsert, skipDuplicates: true });
    }

    return {
      newRecords: toInsert.length,
      duplicateRecords,
      insertedIds: toInsert.map((t) => t.id as string),
    };
  }

  private async createPeriods(
    importBatchId: string,
    transactions: ParsedTransaction[],
    tx: Prisma.TransactionClient,
  ) {
    const byPeriod = new Map<string, ParsedTransaction[]>();
    for (const t of transactions) {
      const [year, month] = t.date.split('-');
      const key = `${year}-${month}`;
      if (!byPeriod.has(key)) byPeriod.set(key, []);
      byPeriod.get(key)!.push(t);
    }

    for (const [key, txns] of byPeriod) {
      const [year, month] = key.split('-').map(Number);
      const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
      const withBalance = sorted.filter((t) => t.balanceAfter !== undefined);
      const first = withBalance[0];
      const last = withBalance[withBalance.length - 1];

      await tx.importBatchPeriod.upsert({
        where: { importBatchId_year_month: { importBatchId, year, month } },
        create: {
          importBatchId,
          year,
          month,
          recordCount: txns.length,
          openingBalance: first ? first.balanceAfter! - first.amount : null,
          closingBalance: last ? last.balanceAfter! : null,
        },
        update: {
          recordCount: txns.length,
        },
      });
    }
  }

  async listHistory(companyId: string) {
    return this.prisma.importBatch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: { periods: true, bankAccount: true },
    });
  }

  async findOne(userId: string, id: string) {
    const batch = await this.prisma.importBatch.findUnique({
      where: { id },
      include: { periods: true },
    });
    if (!batch) throw new NotFoundException('Importação não encontrada');
    await assertUserBelongsToCompany(this.prisma, userId, batch.companyId);
    return this.toSummary(batch);
  }

  private toSummary(batch: Prisma.ImportBatchGetPayload<{ include: { periods: true } }>) {
    return {
      importBatchId: batch.id,
      source: batch.source,
      status: batch.status,
      originalFileName: batch.originalFileName,
      totalRecords: batch.totalRecords,
      newRecords: batch.newRecords,
      duplicateRecords: batch.duplicateRecords,
      ignoredRecords: batch.ignoredRecords,
      statementStartDate: batch.statementStartDate,
      statementEndDate: batch.statementEndDate,
      statementStartBalance: batch.statementStartBalance,
      statementEndBalance: batch.statementEndBalance,
      periods: batch.periods?.map((p) => ({
        year: p.year,
        month: p.month,
        recordCount: p.recordCount,
        openingBalance: p.openingBalance,
        closingBalance: p.closingBalance,
      })),
      errorMessage: batch.errorMessage,
    };
  }
}
