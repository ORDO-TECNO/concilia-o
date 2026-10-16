import type { DFCLine } from '@conciliacao/shared';

interface CategoryTreeNode {
  id: string;
  name: string;
  dfcLine: DFCLine | null;
  children: CategoryTreeNode[];
}

export interface CategoryOption {
  id: string;
  label: string;
  depth: number;
  /** Só folhas com linha da DFC recebem lançamentos/regras (a API rejeita o resto). */
  selectable: boolean;
}

/** Achata a árvore para selects, indentando por nível e marcando o que é atribuível. */
export function toCategoryOptions(nodes: CategoryTreeNode[] = [], depth = 0): CategoryOption[] {
  return nodes.flatMap((n) => [
    {
      id: n.id,
      label: `${'— '.repeat(depth)}${n.name}`,
      depth,
      selectable: n.children.length === 0 && n.dfcLine !== null,
    },
    ...toCategoryOptions(n.children, depth + 1),
  ]);
}
