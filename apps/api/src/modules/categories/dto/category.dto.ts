import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { CategoryKind, DFCLine } from '@prisma/client';

export class CategoryDto {
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  @Length(1, 120)
  name: string;

  @ApiProperty({ enum: CategoryKind })
  @IsEnum(CategoryKind)
  kind: CategoryKind;

  @IsOptional()
  @ApiPropertyOptional({ enum: DFCLine })
  @IsEnum(DFCLine)
  dfcLine?: DFCLine;
}

/** PATCH: todos os campos opcionais; `isActive` permite desativar em vez de excluir. */
export class UpdateCategoryDto extends PartialType(CategoryDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
