import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onTransactionDeleted: () => void;
}

const TransactionDetailsModal = ({ 
  transaction, 
  isOpen, 
  onClose, 
  onEdit, 
  onTransactionDeleted 
}: TransactionDetailsModalProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

  const statusVariant = {
    "Concluído": "default",
    "Pendente": "secondary",
    "Falhou": "destructive",
  } as const;

  const handleEdit = () => {
    onEdit(transaction);
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError("Você precisa estar logado.");
        return;
      }

      // Se a transação estava concluída, precisamos reverter o saldo da conta
      if (transaction.status === 'Concluído' && transaction.account_id) {
        const { data: accountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", transaction.account_id)
          .single();

        if (accountData) {
          const newBalance = accountData.balance - transaction.amount;
          await supabase
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", transaction.account_id);
        }
      }

      // Deletar a transação
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transaction.id)
        .eq("user_id", user.id);

      if (error) {
        showError("Erro ao excluir transação: " + error.message);
        return;
      }

      showSuccess("Transação excluída com sucesso!");
      onTransactionDeleted();
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      showError("Erro inesperado ao excluir transação.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
            {transaction.account && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium text-muted-foreground">Conta</span>
                <span className="col-span-3">{transaction.account.name}</span>
              </div>
            )}
            {transaction.description && (
              <div className="grid grid-cols-4 items-start gap-4">
                <span className="text-right text-sm font-medium text-muted-foreground pt-1">Descrição</span>
                <p className="col-span-3 text-sm">{transaction.description}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex-1 sm:flex-none"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
            <Button onClick={onClose} className="w-full sm:w-auto">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
              {transaction.status === 'Concluído' && (
                <span className="block mt-2 text-sm font-medium">
                  O saldo da conta será ajustado automaticamente.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TransactionDetailsModal;