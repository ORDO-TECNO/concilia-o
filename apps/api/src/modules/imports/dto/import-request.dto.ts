import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ImportRequestDto {
  @IsUUID()
  bankAccountId: string;

  @IsIn(['CSV', 'OFX'])
  source: 'CSV' | 'OFX';

  // Campos abaixo só são usados quando source = 'CSV'
  @IsOptional()
  @IsString()
  dateColumn?: string;

  @IsOptional()
  @IsString()
  descriptionColumn?: string;

  @IsOptional()
  @IsString()
  amountColumn?: string;

  @IsOptional()
  @IsString()
  documentColumn?: string;

  @IsOptional()
  @IsString()
  balanceColumn?: string;

  @IsOptional()
  @IsString()
  creditDebitColumn?: string;

  @IsOptional()
  @IsString()
  delimiter?: string;

  @IsOptional()
  @IsIn(['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'])
  dateFormat?: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';

  @IsOptional()
  @IsIn([',', '.'])
  decimalSeparator?: ',' | '.';
}
