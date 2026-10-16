import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DfcService } from './dfc.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';
import { resolveYear, YearExportQueryDto, YearQueryDto } from '../../common/dto/year-query.dto';

@ApiTags('dfc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@Controller()
export class DfcController {
  constructor(private readonly dfcService: DfcService) {}

  @Get('companies/:companyId/dfc')
  getReport(@Param('companyId') companyId: string, @Query() query: YearQueryDto) {
    return this.dfcService.getReport(companyId, resolveYear(query));
  }

  @Get('companies/:companyId/dfc/export')
  async export(@Param('companyId') companyId: string, @Query() query: YearExportQueryDto, @Res() res: Response) {
    const { buffer, filename, contentType } = await this.dfcService.exportReport(
      companyId,
      resolveYear(query),
      query.format ?? 'csv',
    );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }
}
