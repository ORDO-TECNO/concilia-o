import { ClassificationRule, RuleField, RuleMatchType } from '@prisma/client';

interface MatchableTransaction {
  description: string;
  historico: string | null;
  document: string | null;
}

// Extratos costumam vir sem acento e com espaçamento irregular; o padrão
// digitado pelo usuário costuma ter acento. CONTAINS/EQUALS comparam sem
// acento, sem caixa e com espaços colapsados. REGEX usa o texto original.
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function fieldValue(rule: ClassificationRule, t: MatchableTransaction): string {
  switch (rule.field) {
    case RuleField.HISTORICO:
      return t.historico ?? '';
    case RuleField.DOCUMENTO:
      return t.document ?? '';
    case RuleField.DESCRICAO:
    default:
      return t.description ?? '';
  }
}

export function ruleMatches(rule: ClassificationRule, t: MatchableTransaction): boolean {
  const value = fieldValue(rule, t);

  switch (rule.matchType) {
    case RuleMatchType.EQUALS:
      return normalize(value) === normalize(rule.pattern);
    case RuleMatchType.REGEX:
      try {
        return new RegExp(rule.pattern, 'i').test(value);
      } catch {
        return false;
      }
    case RuleMatchType.CONTAINS:
    default:
      return normalize(value).includes(normalize(rule.pattern));
  }
}

export interface RuleResolution {
  categoryId: string | null;
  partyId: string | null;
  ruleId: string;
}

/**
 * Resolve a classificação de um lançamento a partir das regras já ordenadas
 * por prioridade. Categoria e fornecedor/cliente são resolvidos campo a campo:
 * a categoria vem da primeira regra que bate e define categoria; o
 * fornecedor/cliente, da primeira que bate e define um — e só quando o
 * lançamento ainda não tem um. Assim uma regra só de fornecedor não impede
 * que uma regra de categoria de prioridade menor classifique o lançamento.
 * `ruleId` é a regra que definiu a categoria (ou, sem categoria, a que
 * definiu o fornecedor). Retorna null se nada for aplicável.
 */
export function resolveClassification(
  rules: ClassificationRule[],
  t: MatchableTransaction & { partyId?: string | null },
): RuleResolution | null {
  let categoryRule: ClassificationRule | undefined;
  let partyRule: ClassificationRule | undefined;
  const needsParty = !t.partyId;

  for (const rule of rules) {
    if (categoryRule && (partyRule || !needsParty)) break;
    if (!ruleMatches(rule, t)) continue;
    if (!categoryRule && rule.categoryId) categoryRule = rule;
    if (needsParty && !partyRule && rule.partyId) partyRule = rule;
  }

  if (!categoryRule && !partyRule) return null;
  return {
    categoryId: categoryRule?.categoryId ?? null,
    partyId: partyRule?.partyId ?? null,
    ruleId: (categoryRule ?? partyRule)!.id,
  };
}
