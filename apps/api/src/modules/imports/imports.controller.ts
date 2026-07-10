import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImportsService } from './imports.service';
import { ImportRequestDto } from './dto/import-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../../common/guards/company-access.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @UseGuards(CompanyAccessGuard)
  @Post('companies/:companyId/imports/csv-preview')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  previewCsv(@UploadedFile() file: Express.Multer.File) {
    return this.importsService.previewCsvFile(file.buffer);
  }

  @UseGuards(CompanyAccessGuard)
  @Post('companies/:companyId/imports')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  import(
    @Param('companyId') companyId: string,
    @Body() dto: ImportRequestDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importsService.import(companyId, dto, file);
  }

  @UseGuards(CompanyAccessGuard)
  @Get('companies/:companyId/imports')
  listHistory(@Param('companyId') companyId: string) {
    return this.importsService.listHistory(companyId);
  }

  @Get('imports/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.importsService.findOne(user.userId, id);
  }
}
