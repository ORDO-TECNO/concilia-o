import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class BankAccountDto {
  @IsOptional()
  @IsString()
  @Length(1, 10)
  bankCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  bankName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  agencia?: string;

  @IsString()
  @Length(1, 30)
  conta: string;

  @IsOptional()
  @IsString()
  @Length(1, 4)
  contaDigito?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  apelido?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
