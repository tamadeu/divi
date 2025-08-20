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
import { Bank } from "@/types/database";

interface DeleteBankAlertProps {
  bank: Bank | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteBankAlert = ({ bank, isOpen, onClose, onConfirm }: DeleteBankAlertProps) => {
  if (!bank) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o banco{" "}
            <span className="font-semibold">"{bank.name}"</span> do sistema.
            {/* Note: In a real app, you might want to check if there are accounts using this bank */}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir Banco
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteBankAlert;