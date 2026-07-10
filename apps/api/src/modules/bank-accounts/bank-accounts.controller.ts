import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccountDto } from './dto/bank-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @UseGuards(CompanyAccessGuard)
  @Get('companies/:companyId/bank-accounts')
  list(@Param('companyId') companyId: string) {
    return this.bankAccountsService.list(companyId);
  }

  @UseGuards(CompanyAccessGuard)
  @Post('companies/:companyId/bank-accounts')
  create(@Param('companyId') companyId: string, @Body() dto: BankAccountDto) {
    return this.bankAccountsService.create(companyId, dto);
  }

  @Patch('bank-accounts/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BankAccountDto,
  ) {
    return this.bankAccountsService.update(user.userId, id, dto);
  }

  @Delete('bank-accounts/:id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bankAccountsService.remove(user.userId, id);
  }
}
