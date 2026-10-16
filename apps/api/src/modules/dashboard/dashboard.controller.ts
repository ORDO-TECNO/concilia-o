import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';
import { resolveYear, YearQueryDto } from '../../common/dto/year-query.dto';

@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('companies/:companyId/dashboard/summary')
  getSummary(@Param('companyId') companyId: string, @Query() query: YearQueryDto) {
    return this.dashboardService.getSummary(companyId, resolveYear(query));
  }
}
