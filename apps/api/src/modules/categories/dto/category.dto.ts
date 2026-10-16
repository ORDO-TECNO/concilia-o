import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { CategoryKind, DFCLine } from '@prisma/client';

export class CategoryDto {
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  @Length(1, 120)
  name: string;

  @IsEnum(CategoryKind)
  kind: CategoryKind;

  @IsOptional()
  @IsEnum(DFCLine)
  dfcLine?: DFCLine;
}

/** PATCH: todos os campos opcionais; `isActive` permite desativar em vez de excluir. */
export class UpdateCategoryDto extends PartialType(CategoryDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
