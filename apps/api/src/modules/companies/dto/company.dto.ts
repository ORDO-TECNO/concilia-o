import { IsOptional, IsString, Length } from 'class-validator';

export class CompanyDto {
  @IsString()
  @Length(2, 160)
  name: string;

  @IsOptional()
  @IsString()
  @Length(11, 18)
  cnpj?: string;
}
