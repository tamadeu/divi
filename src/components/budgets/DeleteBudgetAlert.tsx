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
import { BudgetWithSpending } from "@/types/database";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface DeleteBudgetAlertProps {
  budget: BudgetWithSpending | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteBudgetAlert = ({ budget, isOpen, onClose, onConfirm }: DeleteBudgetAlertProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmClick = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  if (!budget) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o orçamento para a categoria{" "}
            <span className="font-semibold">"{budget.category_name}"</span> referente ao mês de{" "}
            <span className="font-semibold">{new Date(budget.month).toLocaleDateString("pt-BR", { month: 'long', year: 'numeric' })}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmClick} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Excluir Orçamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteBudgetAlert;