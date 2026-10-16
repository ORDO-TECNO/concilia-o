import { plainToInstance } from 'class-transformer';
import { IsOptional, validateSync } from 'class-validator';
import { IsCnpj, IsCpfOrCnpj, ToDigits } from './document.decorators';

class Sample {
  @IsOptional()
  @ToDigits()
  @IsCnpj()
  cnpj?: string;

  @IsOptional()
  @ToDigits()
  @IsCpfOrCnpj()
  document?: string;
}

describe('document decorators', () => {
  it('normaliza para dígitos e aceita documento válido', () => {
    const dto = plainToInstance(Sample, { cnpj: '11.222.333/0001-81', document: '529.982.247-25' });
    expect(validateSync(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ cnpj: '11222333000181', document: '52998224725' });
  });

  it('rejeita dígito verificador errado', () => {
    const dto = plainToInstance(Sample, { cnpj: '11.222.333/0001-80', document: '529.982.247-20' });
    expect(validateSync(dto).map((e) => e.property).sort()).toEqual(['cnpj', 'document']);
  });
});
