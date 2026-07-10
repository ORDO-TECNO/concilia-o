import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';

@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('companies/:companyId/dashboard/summary')
  getSummary(@Param('companyId') companyId: string, @Query('year') year?: string) {
    const targetYear = year ? Number(year) : new Date().getFullYear();
    return this.dashboardService.getSummary(companyId, targetYear);
  }
}
