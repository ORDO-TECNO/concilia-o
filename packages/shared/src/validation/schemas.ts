import { z } from 'zod';
import { CategoryKind, DFCLine, PartyKind, RuleField, RuleMatchType } from '../enums';

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const companySchema = z.object({
  name: z.string().min(2).max(160),
  cnpj: z.string().min(11).max(18).optional().nullable(),
});

export const bankAccountSchema = z.object({
  bankCode: z.string().max(10).optional().nullable(),
  bankName: z.string().max(120).optional().nullable(),
  agencia: z.string().max(20).optional().nullable(),
  conta: z.string().min(1).max(30),
  contaDigito: z.string().max(4).optional().nullable(),
  apelido: z.string().max(80).optional().nullable(),
});

export const categorySchema = z.object({
  parentId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(120),
  kind: z.nativeEnum(CategoryKind),
  dfcLine: z.nativeEnum(DFCLine).optional().nullable(),
});

export const partySchema = z.object({
  name: z.string().min(1).max(160),
  document: z.string().max(20).optional().nullable(),
  kind: z.nativeEnum(PartyKind).default(PartyKind.AMBOS),
});

export const classificationRuleSchema = z.object({
  name: z.string().min(1).max(120),
  field: z.nativeEnum(RuleField).default(RuleField.DESCRICAO),
  matchType: z.nativeEnum(RuleMatchType).default(RuleMatchType.CONTAINS),
  pattern: z.string().min(1).max(200),
  categoryId: z.string().uuid().optional().nullable(),
  partyId: z.string().uuid().optional().nullable(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const csvColumnMappingSchema = z.object({
  dateColumn: z.string(),
  descriptionColumn: z.string(),
  amountColumn: z.string(),
  documentColumn: z.string().optional().nullable(),
  balanceColumn: z.string().optional().nullable(),
  creditDebitColumn: z.string().optional().nullable(),
  delimiter: z.string().min(1).max(1).default(','),
  dateFormat: z.enum(['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']).default('DD/MM/YYYY'),
  decimalSeparator: z.enum([',', '.']).default(','),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type BankAccountInput = z.infer<typeof bankAccountSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type PartyInput = z.infer<typeof partySchema>;
export type ClassificationRuleInput = z.infer<typeof classificationRuleSchema>;
export type CsvColumnMappingInput = z.infer<typeof csvColumnMappingSchema>;
