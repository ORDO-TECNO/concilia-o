import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReconciliationStatus } from '@prisma/client';

export class UpdateTransactionDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  partyId?: string;

  @IsOptional()
  @IsEnum(ReconciliationStatus)
  status?: ReconciliationStatus;
}
