import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@conciliacao/web';

export function ConfirmarConciliacao() {
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar conciliação</DialogTitle>
          <DialogDescription>
            Você vai conciliar 12 lançamentos com o extrato do Itaú · Conta Corrente. A ação pode ser revertida na
            aba de auditoria.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button>Conciliar 12 lançamentos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
