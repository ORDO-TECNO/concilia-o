'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useCategoriesFlat } from '@/lib/hooks/use-categories';
import { useParties } from '@/lib/hooks/use-parties';
import {
  useApplyRules,
  useCreateRule,
  useDeleteRule,
  useRules,
  type RuleInput,
} from '@/lib/hooks/use-rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RuleField, RuleMatchType } from '@conciliacao/shared';

const FIELD_LABELS: Record<string, string> = {
  DESCRICAO: 'Descrição',
  HISTORICO: 'Histórico',
  DOCUMENTO: 'Documento',
};

const MATCH_LABELS: Record<string, string> = {
  CONTAINS: 'Contém',
  EQUALS: 'Igual a',
  REGEX: 'Expressão regular',
};

const NONE = '__none__';

export default function RegrasPage() {
  const { currentCompanyId } = useAuth();
  const { data: rules, isLoading } = useRules(currentCompanyId);
  const { data: categories } = useCategoriesFlat(currentCompanyId);
  const { data: parties } = useParties(currentCompanyId);
  const createRule = useCreateRule(currentCompanyId);
  const deleteRule = useDeleteRule(currentCompanyId);
  const applyRules = useApplyRules(currentCompanyId);

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<RuleInput>({
    name: '',
    field: RuleField.DESCRICAO,
    matchType: RuleMatchType.CONTAINS,
    pattern: '',
    priority: 0,
  });
  const [lastApplied, setLastApplied] = React.useState<number | null>(null);

  if (!currentCompanyId) {
    return <p className="text-sm text-muted-foreground">Selecione uma empresa no topo da página.</p>;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createRule.mutateAsync(form);
    setForm({ name: '', field: RuleField.DESCRICAO, matchType: RuleMatchType.CONTAINS, pattern: '', priority: 0 });
    setOpen(false);
  }

  async function handleApply() {
    const result = await applyRules.mutateAsync();
    setLastApplied(result.appliedCount);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Regras de classificação</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleApply} disabled={applyRules.isPending}>
            {applyRules.isPending ? 'Aplicando...' : 'Reaplicar em pendentes'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-tour="regras-nova">Nova regra</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova regra de classificação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome da regra</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Campo</Label>
                    <Select
                      value={form.field}
                      onValueChange={(v) => setForm((f) => ({ ...f, field: v as RuleField }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FIELD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo de correspondência</Label>
                    <Select
                      value={form.matchType}
                      onValueChange={(v) => setForm((f) => ({ ...f, matchType: v as RuleMatchType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MATCH_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pattern">
                    Padrão {form.matchType === 'REGEX' ? '(expressão regular)' : '(texto)'}
                  </Label>
                  <Input
                    id="pattern"
                    required
                    placeholder="Ex: PAG PIX JOAO"
                    value={form.pattern}
                    onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Categoria a aplicar</Label>
                    <Select
                      value={form.categoryId ?? NONE}
                      onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === NONE ? undefined : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="(nenhuma)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>(nenhuma)</SelectItem>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fornecedor/Cliente a aplicar</Label>
                    <Select
                      value={form.partyId ?? NONE}
                      onValueChange={(v) => setForm((f) => ({ ...f, partyId: v === NONE ? undefined : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="(nenhum)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>(nenhum)</SelectItem>
                        {parties?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priority">
                    Prioridade (regras com prioridade maior são avaliadas primeiro)
                  </Label>
                  <Input
                    id="priority"
                    type="number"
                    value={form.priority ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createRule.isPending}>
                    {createRule.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {lastApplied !== null && (
        <p className="text-sm text-muted-foreground">
          Última reaplicação classificou {lastApplied} lançamento(s) pendente(s).
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Campo</TableHead>
            <TableHead>Correspondência</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          )}
          {rules?.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{FIELD_LABELS[r.field]}</TableCell>
              <TableCell>
                {MATCH_LABELS[r.matchType]}: <code className="text-xs">{r.pattern}</code>
              </TableCell>
              <TableCell>{r.category?.name ?? '-'}</TableCell>
              <TableCell>{r.priority}</TableCell>
              <TableCell>
                <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Ativa' : 'Inativa'}</Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => deleteRule.mutate(r.id)}>
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
