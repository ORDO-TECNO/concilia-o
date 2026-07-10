import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { DfcService } from './dfc.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';

@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@Controller()
export class DfcController {
  constructor(private readonly dfcService: DfcService) {}

  @Get('companies/:companyId/dfc')
  getReport(@Param('companyId') companyId: string, @Query('year') year?: string) {
    const targetYear = year ? Number(year) : new Date().getFullYear();
    return this.dfcService.getReport(companyId, targetYear);
  }

  @Get('companies/:companyId/dfc/export')
  async export(
    @Param('companyId') companyId: string,
    @Query('year') year: string | undefined,
    @Query('format') format: 'csv' | 'xlsx' | undefined,
    @Res() res: Response,
  ) {
    const targetYear = year ? Number(year) : new Date().getFullYear();
    const { buffer, filename, contentType } = await this.dfcService.exportReport(
      companyId,
      targetYear,
      format ?? 'csv',
    );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }
}
