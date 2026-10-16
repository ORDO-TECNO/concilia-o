import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { assertUserBelongsToCompany } from '../../common/auth/company-membership';
import { BankAccountDto } from './dto/bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string) {
    return this.prisma.bankAccount.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(companyId: string, dto: BankAccountDto) {
    return this.prisma.bankAccount.create({
      data: { companyId, ...dto },
    });
  }

  async update(userId: string, id: string, dto: Partial<BankAccountDto>) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Conta bancária não encontrada');
    await assertUserBelongsToCompany(this.prisma, userId, account.companyId);

    return this.prisma.bankAccount.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Conta bancária não encontrada');
    await assertUserBelongsToCompany(this.prisma, userId, account.companyId);

    // A exclusão é em cascata no banco (lançamentos e importações). Apagar o
    // histórico de uma conta é irreversível e muda DFCs já fechadas — só é
    // permitido para contas que nunca receberam extrato.
    const [transactionCount, importCount] = await Promise.all([
      this.prisma.transaction.count({ where: { bankAccountId: id } }),
      this.prisma.importBatch.count({ where: { bankAccountId: id } }),
    ]);
    if (transactionCount > 0 || importCount > 0) {
      throw new BadRequestException(
        'Esta conta já tem extratos importados — desative-a em vez de excluir para preservar o histórico',
      );
    }
    await this.prisma.bankAccount.delete({ where: { id } });
    return { success: true };
  }
}
