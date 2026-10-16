'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  useCategoryTree,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
  type CategoryNode,
} from '@/lib/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allDFCLines, CategoryKind, dfcLinesForKind, type DFCLine } from '@conciliacao/shared';

const DFC_LINE_LABELS = new Map(allDFCLines().map((l) => [l.line, l.label]));

const KIND_LABELS: Record<string, string> = {
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
  INVESTIMENTO: 'Investimento',
  FINANCIAMENTO: 'Financiamento',
};

function CategoryRow({
  node,
  depth,
  onDelete,
  onDeactivate,
}: {
  node: CategoryNode;
  depth: number;
  onDelete: (id: string) => void;
  onDeactivate: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/50"
        style={{ paddingLeft: depth * 20 + 8 }}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button onClick={() => setExpanded((v) => !v)} className="text-muted-foreground">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className="text-sm">{node.name}</span>
          <Badge variant="outline">{KIND_LABELS[node.kind]}</Badge>
          {node.dfcLine && (
            <Badge variant="secondary" className="text-[10px]">
              {DFC_LINE_LABELS.get(node.dfcLine) ?? node.dfcLine}
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onDeactivate(node.id)}>
            Desativar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(node.id)}>
            Excluir
          </Button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <CategoryRow
              key={child.id}
              node={child}
              depth={depth + 1}
              onDelete={onDelete}
              onDeactivate={onDeactivate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriasPage() {
  const { currentCompanyId } = useAuth();
  const { data: tree, isLoading } = useCategoryTree(currentCompanyId);
  const createCategory = useCreateCategory(currentCompanyId);
  const deleteCategory = useDeleteCategory(currentCompanyId);
  const updateCategory = useUpdateCategory(currentCompanyId);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [kind, setKind] = React.useState<string>(CategoryKind.DESPESA);
  const [dfcLine, setDfcLine] = React.useState<string>('none');
  const [parentId, setParentId] = React.useState<string>('none');

  if (!currentCompanyId) {
    return <p className="text-sm text-muted-foreground">Selecione uma empresa no topo da página.</p>;
  }

  function flattenForParentOptions(nodes: CategoryNode[] = [], depth = 0): { id: string; label: string }[] {
    return nodes.flatMap((n) => [
      { id: n.id, label: `${'— '.repeat(depth)}${n.name}` },
      ...flattenForParentOptions(n.children, depth + 1),
    ]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createCategory.mutateAsync({
      name,
      kind: kind as CategoryKind,
      dfcLine: dfcLine === 'none' ? undefined : (dfcLine as DFCLine),
      parentId: parentId === 'none' ? undefined : parentId,
    });
    setName('');
    setDfcLine('none');
    setParentId('none');
    setOpen(false);
  }

  function handleDelete(id: string) {
    // Erros (ex: categoria com lançamentos) aparecem no toast global.
    deleteCategory.mutate(id);
  }

  const parentOptions = flattenForParentOptions(tree);
  // Só as linhas compatíveis com o tipo (a API rejeita, p.ex., Receita → Dividendos).
  const allowedLines = dfcLinesForKind(kind as CategoryKind);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categorias</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Nova categoria</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={kind}
                  onValueChange={(next) => {
                    setKind(next);
                    if (dfcLine !== 'none' && !dfcLinesForKind(next as CategoryKind).some((l) => l.line === dfcLine)) {
                      setDfcLine('none');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KIND_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria pai</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(nenhuma — categoria raiz)</SelectItem>
                    {parentOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Linha do DFC (para categorias-folha)</Label>
                <Select value={dfcLine} onValueChange={setDfcLine}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(nenhuma — categoria agrupadora)</SelectItem>
                    {allowedLines.map((l) => (
                      <SelectItem key={l.line} value={l.line}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createCategory.isPending}>
                  {createCategory.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card p-2">
        {isLoading && <p className="p-2 text-sm text-muted-foreground">Carregando...</p>}
        {tree?.map((node) => (
          <CategoryRow
            key={node.id}
            node={node}
            depth={0}
            onDelete={handleDelete}
            onDeactivate={(id) => updateCategory.mutate({ id, input: { isActive: false } })}
          />
        ))}
      </div>
    </div>
  );
}
