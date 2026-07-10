import { ClassificationRule, RuleField, RuleMatchType } from '@prisma/client';

interface MatchableTransaction {
  description: string;
  historico: string | null;
  document: string | null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
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
