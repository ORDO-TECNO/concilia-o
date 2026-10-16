import { resolveClassification, ruleMatches } from './rule-matcher';
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

  it('CONTAINS/EQUALS ignoram acentos e espaços repetidos', () => {
    const rule = makeRule({ pattern: 'Energia Elétrica' });
    expect(ruleMatches(rule, { description: 'PAG ENERGIA   ELETRICA SA', historico: null, document: null })).toBe(true);
    const equals = makeRule({ matchType: RuleMatchType.EQUALS, pattern: 'tarifa  pacote serviços' });
    expect(ruleMatches(equals, { description: 'TARIFA PACOTE SERVICOS', historico: null, document: null })).toBe(true);
  });
});

describe('resolveClassification', () => {
  const t = { description: 'PIX ENERGISA MT', historico: null, document: null };

  it('primeira regra que bate e define categoria vence', () => {
    const rules = [
      makeRule({ id: 'r1', pattern: 'ENERGISA', categoryId: 'cat-1', priority: 10 }),
      makeRule({ id: 'r2', pattern: 'PIX', categoryId: 'cat-2', priority: 5 }),
    ];
    expect(resolveClassification(rules, t)).toEqual({ categoryId: 'cat-1', partyId: null, ruleId: 'r1' });
  });

  it('regra só de fornecedor não bloqueia a categoria de uma regra de prioridade menor', () => {
    const rules = [
      makeRule({ id: 'party', pattern: 'ENERGISA', partyId: 'p-1', priority: 10 }),
      makeRule({ id: 'cat', pattern: 'PIX', categoryId: 'cat-1', priority: 1 }),
    ];
    expect(resolveClassification(rules, t)).toEqual({ categoryId: 'cat-1', partyId: 'p-1', ruleId: 'cat' });
  });

  it('não sobrescreve fornecedor já definido no lançamento', () => {
    const rules = [makeRule({ id: 'r1', pattern: 'ENERGISA', categoryId: 'cat-1', partyId: 'p-1' })];
    expect(resolveClassification(rules, { ...t, partyId: 'manual' })).toEqual({
      categoryId: 'cat-1',
      partyId: null,
      ruleId: 'r1',
    });
  });

  it('retorna null quando nenhuma regra aplicável bate', () => {
    const rules = [makeRule({ pattern: 'OUTRA COISA', categoryId: 'cat-1' })];
    expect(resolveClassification(rules, t)).toBeNull();
  });

  it('regra sem alvo (legado) é ignorada', () => {
    const rules = [makeRule({ id: 'vazia', pattern: 'PIX' }), makeRule({ id: 'ok', pattern: 'PIX', categoryId: 'c' })];
    expect(resolveClassification(rules, t)?.ruleId).toBe('ok');
  });
});
