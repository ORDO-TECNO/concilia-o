import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(CompanyAccessGuard)
  @Get('companies/:companyId/categories')
  list(@Param('companyId') companyId: string, @Query('flat') flat?: string) {
    return this.categoriesService.list(companyId, flat === 'true');
  }

  @UseGuards(CompanyAccessGuard)
  @Post('companies/:companyId/categories')
  create(@Param('companyId') companyId: string, @Body() dto: CategoryDto) {
    return this.categoriesService.create(companyId, dto);
  }

  @Patch('categories/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CategoryDto,
  ) {
    return this.categoriesService.update(user.userId, id, dto);
  }

  @Delete('categories/:id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.categoriesService.remove(user.userId, id);
  }
}
