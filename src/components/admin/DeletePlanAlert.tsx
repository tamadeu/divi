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
import { SubscriptionPlan } from "@/types/subscription-plans";
import { Badge } from "@/components/ui/badge";

interface DeletePlanAlertProps {
  plan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeletePlanAlert = ({ plan, isOpen, onClose, onConfirm }: DeletePlanAlertProps) => {
  if (!plan) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o plano{" "}
                <span className="font-semibold">"{plan.name}"</span> do sistema.
              </p>
              
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium mb-2">Detalhes do plano:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Preço mensal:</span>
                    <span className="font-medium">{formatPrice(plan.price_monthly)}</span>
                  </div>
                  {plan.price_yearly && (
                    <div className="flex justify-between">
                      <span>Preço anual:</span>
                      <span className="font-medium">{formatPrice(plan.price_yearly)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={plan.is_active ? "default" : "secondary"} className="text-xs">
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                <strong>Atenção:</strong> Se houver usuários atualmente usando este plano, 
                eles podem ser afetados. Considere desativar o plano ao invés de excluí-lo.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir Plano
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePlanAlert;