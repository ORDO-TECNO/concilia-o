import { ArrayMinSize, IsArray, IsIn, IsOptional, IsUUID } from 'class-validator';

export type BulkTransactionAction = 'CONCILIAR' | 'IGNORAR' | 'EXCLUIR' | 'CATEGORIZAR';

export class BulkTransactionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  ids: string[];

  @IsIn(['CONCILIAR', 'IGNORAR', 'EXCLUIR', 'CATEGORIZAR'])
  action: BulkTransactionAction;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
