import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { IsCnpj, ToDigits } from '../../../common/validation/document.decorators';

export class CompanyDto {
  @IsString()
  @Length(2, 160)
  name: string;

  @IsOptional()
  @IsString()
  @ToDigits()
  @IsCnpj()
  cnpj?: string;
}

export class UpdateCompanyDto extends PartialType(CompanyDto) {}
