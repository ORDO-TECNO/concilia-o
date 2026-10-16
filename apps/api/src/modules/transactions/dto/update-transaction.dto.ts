import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReconciliationStatus } from '@prisma/client';

export class UpdateTransactionDto {
  /** `null` remove a classificação. */
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  /** `null` desvincula o fornecedor/cliente. */
  @IsOptional()
  @IsUUID()
  partyId?: string | null;

  @IsOptional()
  @IsEnum(ReconciliationStatus)
  status?: ReconciliationStatus;
}
