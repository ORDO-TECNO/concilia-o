'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useCompanies, useCreateCompany } from '@/lib/hooks/use-companies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function EmpresasPage() {
  const { refetchMe } = useAuth();
  const { data: companies, isLoading } = useCompanies();
  const createCompany = useCreateCompany();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [cnpj, setCnpj] = React.useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createCompany.mutateAsync({ name, cnpj: cnpj || undefined });
    await refetchMe();
    setName('');
    setCnpj('');
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Empresas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Nova empresa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova empresa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createCompany.isPending}>
                  {createCompany.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Papel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          )}
          {companies?.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.cnpj ?? '-'}</TableCell>
              <TableCell>
                <Badge variant="secondary">{c.role}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
