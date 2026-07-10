import { IsIn, IsOptional } from 'class-validator';
import { ListTransactionsQueryDto } from './list-transactions.dto';

export class ExportTransactionsQueryDto extends ListTransactionsQueryDto {
  @IsOptional()
  @IsIn(['csv', 'xlsx'])
  format?: 'csv' | 'xlsx' = 'csv';
}
