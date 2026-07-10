'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useParties, useCreateParty, useDeleteParty } from '@/lib/hooks/use-parties';
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
import { PartyKind } from '@conciliacao/shared';

const KIND_LABELS: Record<string, string> = {
  FORNECEDOR: 'Fornecedor',
  CLIENTE: 'Cliente',
  AMBOS: 'Ambos',
};

export default function FornecedoresPage() {
  const { currentCompanyId } = useAuth();
  const [search, setSearch] = React.useState('');
  const { data: parties, isLoading } = useParties(currentCompanyId, search);
  const createParty = useCreateParty(currentCompanyId);
  const deleteParty = useDeleteParty(currentCompanyId);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [document, setDocument] = React.useState('');
  const [kind, setKind] = React.useState<string>(PartyKind.AMBOS);

  if (!currentCompanyId) {
    return <p className="text-sm text-muted-foreground">Selecione uma empresa no topo da página.</p>;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createParty.mutateAsync({ name, document: document || undefined, kind: kind as PartyKind });
    setName('');
    setDocument('');
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Fornecedores e Clientes</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Novo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo fornecedor/cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="document">CNPJ/CPF (opcional)</Label>
                  <Input id="document" value={document} onChange={(e) => setDocument(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={kind} onValueChange={setKind}>
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
                <DialogFooter>
                  <Button type="submit" disabled={createParty.isPending}>
                    {createParty.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          )}
          {parties?.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.document ?? '-'}</TableCell>
              <TableCell>
                <Badge variant="outline">{KIND_LABELS[p.kind]}</Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => deleteParty.mutate(p.id)}>
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
