import { Transform } from 'class-transformer';
import { ValidateBy, type ValidationOptions } from 'class-validator';
import { isValidCnpj, isValidCpfOrCnpj, onlyDigits } from '@conciliacao/shared';

/** Guarda só os dígitos de CPF/CNPJ — a unicidade não pode depender da máscara. */
export function ToDigits(): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string' ? onlyDigits(value) : value));
}

export function IsCnpj(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    { name: 'isCnpj', validator: { validate: (v) => typeof v === 'string' && isValidCnpj(v), defaultMessage: () => 'CNPJ inválido' } },
    options,
  );
}

export function IsCpfOrCnpj(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCpfOrCnpj',
      validator: { validate: (v) => typeof v === 'string' && isValidCpfOrCnpj(v), defaultMessage: () => 'CPF/CNPJ inválido' },
    },
    options,
  );
}
