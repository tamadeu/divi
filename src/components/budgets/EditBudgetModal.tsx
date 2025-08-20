import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface BudgetWithSpending {
  id: string;
  category_id: string;
  category_name: string;
  budgeted_amount: number;
  spent_amount: number;
}

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetWithSpending;
  onBudgetUpdated: () => void;
  selectedMonth: string;
}

const EditBudgetModal = ({ isOpen, onClose, budget, onBudgetUpdated, selectedMonth }: EditBudgetModalProps) => {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budget) {
      setAmount(budget.budgeted_amount);
    }
  }, [budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount <= 0) {
      showError("O valor do orçamento deve ser maior que zero");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("budgets")
      .update({
        amount: amount,
      })
      .eq("id", budget.id);

    if (error) {
      showError("Erro ao atualizar orçamento");
      console.error("Error updating budget:", error);
    } else {
      showSuccess("Orçamento atualizado com sucesso!");
      onBudgetUpdated();
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Orçamento</DialogTitle>
          <DialogDescription>
            Atualize o valor do orçamento para {budget?.category_name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={budget?.category_name || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="spent_amount">Valor Gasto</Label>
              <Input
                id="spent_amount"
                value={formatCurrency(budget?.spent_amount || 0)}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Este valor é calculado automaticamente com base nas transações.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor Orçado</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBudgetModal;