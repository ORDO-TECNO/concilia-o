import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { IsCpfOrCnpj, ToDigits } from '../../../common/validation/document.decorators';
import { PartyKind } from '@prisma/client';

export class PartyDto {
  @IsString()
  @Length(1, 160)
  name: string;

  /** CPF ou CNPJ; gravado só com dígitos para a unicidade por empresa não depender da máscara. */
  @IsOptional()
  @IsString()
  @ToDigits()
  @IsCpfOrCnpj()
  document?: string;

  @IsOptional()
  @ApiPropertyOptional({ enum: PartyKind })
  @IsEnum(PartyKind)
  kind?: PartyKind;
}

export class UpdatePartyDto extends PartialType(PartyDto) {}
