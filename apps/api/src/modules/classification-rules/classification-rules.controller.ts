import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ClassificationRulesService } from './classification-rules.service';
import { ClassificationRuleDto } from './dto/classification-rule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class ClassificationRulesController {
  constructor(private readonly rulesService: ClassificationRulesService) {}

  @UseGuards(CompanyAccessGuard)
  @Get('companies/:companyId/rules')
  list(@Param('companyId') companyId: string) {
    return this.rulesService.list(companyId);
  }

  @UseGuards(CompanyAccessGuard)
  @Post('companies/:companyId/rules')
  create(@Param('companyId') companyId: string, @Body() dto: ClassificationRuleDto) {
    return this.rulesService.create(companyId, dto);
  }

  @UseGuards(CompanyAccessGuard)
  @Post('companies/:companyId/rules/apply')
  apply(@Param('companyId') companyId: string) {
    return this.rulesService.applyToTransactions(companyId);
  }

  @Patch('rules/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ClassificationRuleDto,
  ) {
    return this.rulesService.update(user.userId, id, dto);
  }

  @Delete('rules/:id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.rulesService.remove(user.userId, id);
  }
}
