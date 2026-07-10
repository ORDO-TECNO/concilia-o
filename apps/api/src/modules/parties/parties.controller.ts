import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PartiesService } from './parties.service';
import { PartyDto } from './dto/party.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @UseGuards(CompanyAccessGuard)
  @Get('companies/:companyId/parties')
  list(@Param('companyId') companyId: string, @Query('search') search?: string) {
    return this.partiesService.list(companyId, search);
  }

  @UseGuards(CompanyAccessGuard)
  @Post('companies/:companyId/parties')
  create(@Param('companyId') companyId: string, @Body() dto: PartyDto) {
    return this.partiesService.create(companyId, dto);
  }

  @Patch('parties/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: PartyDto) {
    return this.partiesService.update(user.userId, id, dto);
  }

  @Delete('parties/:id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.partiesService.remove(user.userId, id);
  }
}
