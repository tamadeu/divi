import { useState, useEffect } from "react";
import BudgetItem from "@/components/budgets/BudgetItem";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BudgetWithSpending } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import AddBudgetModal from "@/components/budgets/AddBudgetModal";
import EditBudgetModal from "@/components/budgets/EditBudgetModal"; // New import
import DeleteBudgetAlert from "@/components/budgets/DeleteBudgetAlert"; // New import
import { showError, showSuccess } from "@/utils/toast"; // Ensure these are imported

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null); // New state
  const [deletingBudget, setDeletingBudget] = useState<BudgetWithSpending | null>(null); // New state

  const fetchBudgets = async () => {
    setLoading(true);
    const currentMonth = new Date().toISOString();
    const { data, error } = await supabase.rpc('get_budgets_with_spending', {
      budget_month: currentMonth
    });

    if (error) {
      console.error("Error fetching budgets:", error);
    } else {
      setBudgets(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleEditBudget = (budget: BudgetWithSpending) => {
    setEditingBudget(budget);
  };

  const handleDeleteBudget = (budget: BudgetWithSpending) => {
    setDeletingBudget(budget);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBudget) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado para excluir um orçamento.");
      setDeletingBudget(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", deletingBudget.id)
        .eq("user_id", user.id); // Ensure user owns the budget

      if (error) {
        throw error;
      }

      showSuccess("Orçamento excluído com sucesso!");
      fetchBudgets();
      setDeletingBudget(null);
    } catch (error: any) {
      showError("Erro ao excluir orçamento: " + error.message);
      console.error("Delete budget error:", error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Orçamentos</h1>
        <Button size="sm" className="gap-1" onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetItem 
              key={budget.id} 
              budget={budget} 
              onEdit={handleEditBudget} // Pass edit handler
              onDelete={handleDeleteBudget} // Pass delete handler
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              Nenhum orçamento para este mês
            </h3>
            <p className="text-sm text-muted-foreground">
              Crie seu primeiro orçamento para começar a acompanhar.
            </p>
            <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Orçamento
            </Button>
          </div>
        </div>
      )}
      <AddBudgetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBudgetAdded={() => {
          fetchBudgets();
          setIsAddModalOpen(false);
        }}
      />
      {/* New Modals for Edit and Delete */}
      <EditBudgetModal
        isOpen={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        onBudgetUpdated={fetchBudgets}
        budget={editingBudget}
        onDeleteRequest={handleDeleteBudget} // Allow initiating delete from edit modal
      />
      <DeleteBudgetAlert
        isOpen={!!deletingBudget}
        onClose={() => setDeletingBudget(null)}
        budget={deletingBudget}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default BudgetsPage;