import { ruleMatches } from './rule-matcher';
import { ClassificationRule, RuleField, RuleMatchType } from '@prisma/client';

function makeRule(overrides: Partial<ClassificationRule> = {}): ClassificationRule {
  return {
    id: 'rule-1',
    companyId: 'company-1',
    name: 'Regra Teste',
    field: RuleField.DESCRICAO,
    matchType: RuleMatchType.CONTAINS,
    pattern: 'PAG PIX JOAO',
    categoryId: null,
    partyId: null,
    priority: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ruleMatches', () => {
  it('CONTAINS é case-insensitive e ignora espaços nas pontas', () => {
    const rule = makeRule({ pattern: 'pag pix joao' });
    expect(ruleMatches(rule, { description: '  PAG PIX JOAO FORNECEDOR  ', historico: null, document: null })).toBe(true);
  });

  it('CONTAINS não bate quando o texto não contém o padrão', () => {
    const rule = makeRule();
    expect(ruleMatches(rule, { description: 'GOOGLE ADS', historico: null, document: null })).toBe(false);
  });

  it('EQUALS exige igualdade exata (após normalização)', () => {
    const rule = makeRule({ matchType: RuleMatchType.EQUALS, pattern: 'Tarifa Bancaria' });
    expect(ruleMatches(rule, { description: 'tarifa bancaria', historico: null, document: null })).toBe(true);
    expect(ruleMatches(rule, { description: 'tarifa bancaria mensal', historico: null, document: null })).toBe(false);
  });

  it('REGEX aplica a expressão regular (case-insensitive)', () => {
    const rule = makeRule({ matchType: RuleMatchType.REGEX, pattern: '^PIX \\d+$' });
    expect(ruleMatches(rule, { description: 'pix 123', historico: null, document: null })).toBe(true);
    expect(ruleMatches(rule, { description: 'pix abc', historico: null, document: null })).toBe(false);
  });

  it('REGEX inválida não derruba a aplicação — apenas não casa', () => {
    const rule = makeRule({ matchType: RuleMatchType.REGEX, pattern: '(' });
    expect(ruleMatches(rule, { description: 'qualquer coisa', historico: null, document: null })).toBe(false);
  });

  it('respeita o campo configurado (HISTORICO em vez de DESCRICAO)', () => {
    const rule = makeRule({ field: RuleField.HISTORICO, pattern: 'NOTA FISCAL' });
    expect(
      ruleMatches(rule, { description: 'PAGAMENTO', historico: 'REF NOTA FISCAL 123', document: null }),
    ).toBe(true);
    expect(ruleMatches(rule, { description: 'REF NOTA FISCAL 123', historico: null, document: null })).toBe(false);
  });

  it('campo ausente (historico/document nulo) não quebra o match — trata como vazio', () => {
    const rule = makeRule({ field: RuleField.DOCUMENTO, matchType: RuleMatchType.EQUALS, pattern: '' });
    expect(ruleMatches(rule, { description: 'x', historico: null, document: null })).toBe(true);
  });
});
