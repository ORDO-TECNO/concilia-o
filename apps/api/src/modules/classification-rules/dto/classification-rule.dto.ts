import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { RuleField, RuleMatchType } from '@prisma/client';

export class ClassificationRuleDto {
  @IsString()
  @Length(1, 120)
  name: string;

  @IsOptional()
  @IsEnum(RuleField)
  field?: RuleField;

  @IsOptional()
  @IsEnum(RuleMatchType)
  matchType?: RuleMatchType;

  @IsString()
  @Length(1, 200)
  pattern: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  partyId?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
