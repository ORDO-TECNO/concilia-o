import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

/** `?year=` dos relatórios anuais (DFC, dashboard). Ausente = ano corrente. */
export class YearQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2999)
  year?: number;
}

export class YearExportQueryDto extends YearQueryDto {
  @IsOptional()
  @IsIn(['csv', 'xlsx'])
  format?: 'csv' | 'xlsx';
}

export function resolveYear(query: YearQueryDto): number {
  return query.year ?? new Date().getFullYear();
}
