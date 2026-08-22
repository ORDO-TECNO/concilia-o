'use client';

import * as React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  useBankAccounts,
  useCreateBankAccount,
  useDeleteBankAccount,
} from '@/lib/hooks/use-bank-accounts';
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

export default function ContasPage() {
  const { currentCompanyId } = useAuth();
  const { data: accounts, isLoading } = useBankAccounts(currentCompanyId);
  const createAccount = useCreateBankAccount(currentCompanyId);
  const deleteAccount = useDeleteBankAccount(currentCompanyId);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ bankName: '', bankCode: '', agencia: '', conta: '', apelido: '' });

  if (!currentCompanyId) {
    return <p className="text-sm text-muted-foreground">Selecione uma empresa no topo da página.</p>;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createAccount.mutateAsync(form);
    setForm({ bankName: '', bankCode: '', agencia: '', conta: '', apelido: '' });
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contas bancárias</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Nova conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova conta bancária</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bankName">Banco</Label>
                  <Input
                    id="bankName"
                    value={form.bankName}
                    onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bankCode">Código (FEBRABAN)</Label>
                  <Input
                    id="bankCode"
                    value={form.bankCode}
                    onChange={(e) => setForm((f) => ({ ...f, bankCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="agencia">Agência</Label>
                  <Input
                    id="agencia"
                    value={form.agencia}
                    onChange={(e) => setForm((f) => ({ ...f, agencia: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="conta">Conta</Label>
                  <Input
                    id="conta"
                    required
                    value={form.conta}
                    onChange={(e) => setForm((f) => ({ ...f, conta: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apelido">Apelido</Label>
                <Input
                  id="apelido"
                  value={form.apelido}
                  onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createAccount.isPending}>
                  {createAccount.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Apelido</TableHead>
            <TableHead>Banco</TableHead>
            <TableHead>Agência</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          )}
          {accounts?.map((acc) => (
            <TableRow key={acc.id}>
              <TableCell className="font-medium">{acc.apelido ?? '-'}</TableCell>
              <TableCell>
                {acc.bankName ?? '-'} {acc.bankCode ? `(${acc.bankCode})` : ''}
              </TableCell>
              <TableCell>{acc.agencia ?? '-'}</TableCell>
              <TableCell>
                {acc.conta}
                {acc.contaDigito ? `-${acc.contaDigito}` : ''}
              </TableCell>
              <TableCell>
                <Badge variant={acc.isActive ? 'success' : 'secondary'}>
                  {acc.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAccount.mutate(acc.id)}
                  disabled={deleteAccount.isPending}
                >
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
