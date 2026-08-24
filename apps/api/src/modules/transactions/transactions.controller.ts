import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { ListTransactionsQueryDto } from './dto/list-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { BulkTransactionsDto } from './dto/bulk-transactions.dto';
import { ExportTransactionsQueryDto } from './dto/export-transactions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(CompanyAccessGuard)
  @Get('companies/:companyId/transactions')
  list(@Param('companyId') companyId: string, @Query() query: ListTransactionsQueryDto) {
    return this.transactionsService.list(companyId, query);
  }

  @UseGuards(CompanyAccessGuard)
  @Get('companies/:companyId/transactions/export')
  async export(
    @Param('companyId') companyId: string,
    @Query() query: ExportTransactionsQueryDto,
    @Res() res: Response,
  ) {
    await this.transactionsService.streamExport(companyId, query, res);
  }

  @UseGuards(CompanyAccessGuard)
  @Post('companies/:companyId/transactions/bulk')
  bulk(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId') companyId: string,
    @Body() dto: BulkTransactionsDto,
  ) {
    return this.transactionsService.bulk(user.userId, companyId, dto);
  }

  @Patch('transactions/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(user.userId, id, dto);
  }
}
