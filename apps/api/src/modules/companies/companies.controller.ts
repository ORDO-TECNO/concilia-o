import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompanyDto } from './dto/company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.listForUser(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CompanyDto) {
    return this.companiesService.create(user.userId, dto);
  }

  @UseGuards(CompanyAccessGuard)
  @Get(':companyId')
  findOne(@Param('companyId') companyId: string) {
    return this.companiesService.findOne(companyId);
  }

  @UseGuards(CompanyAccessGuard)
  @Patch(':companyId')
  update(@Param('companyId') companyId: string, @Body() dto: CompanyDto) {
    return this.companiesService.update(companyId, dto);
  }
}
