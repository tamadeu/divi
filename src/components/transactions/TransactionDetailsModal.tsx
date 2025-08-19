import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/database";
import { Badge } from "@/components/ui/badge";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionDetailsModal = ({ transaction, isOpen, onClose }: TransactionDetailsModalProps) => {
  if (!transaction) return null;

  const statusVariant = {
    "Concluído": "default",
    "Pendente": "secondary",
    "Falhou": "destructive",
  } as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
          <DialogDescription>Visão detalhada da sua transação.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Nome</span>
            <span className="col-span-3 font-semibold">{transaction.name}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Valor</span>
            <span className={`col-span-3 font-semibold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {transaction.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Data</span>
            <span className="col-span-3">{new Date(transaction.date).toLocaleDateString("pt-BR")}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Status</span>
            <div className="col-span-3">
              <Badge variant={statusVariant[transaction.status]}>{transaction.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Categoria</span>
            <span className="col-span-3">{transaction.category}</span>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground pt-1">Descrição</span>
            <p className="col-span-3 text-sm">{transaction.description}</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsModal;