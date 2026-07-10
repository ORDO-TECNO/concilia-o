import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PartyKind } from '@prisma/client';

export class PartyDto {
  @IsString()
  @Length(1, 160)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  document?: string;

  @IsOptional()
  @IsEnum(PartyKind)
  kind?: PartyKind;
}
