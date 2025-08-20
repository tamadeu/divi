import { useState, useEffect } from "react";
import BudgetItem from "@/components/budgets/BudgetItem";
import { Button } from "@/components/ui/button";
import { PlusCircle, Copy, Loader2 } from "lucide-react"; // Added Copy and Loader2 icons
import { supabase } from "@/integrations/supabase/client";
import { BudgetWithSpending } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import AddBudgetModal from "@/components/budgets/AddBudgetModal";
import EditBudgetModal from "@/components/budgets/EditBudgetModal";
import DeleteBudgetAlert from "@/components/budgets/DeleteBudgetAlert";
import { showError, showSuccess } from "@/utils/toast";
import MonthPicker from "@/components/budgets/MonthPicker";
import { format, subMonths } from "date-fns"; // Added subMonths
import { ptBR } from "date-fns/locale";

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetWithSpending | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isCopying, setIsCopying] = useState(false); // New state for copying

  const fetchBudgets = async () => {
    setLoading(true);
    const monthToFetch = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const { data, error } = await supabase.rpc('get_budgets_with_spending', {
      budget_month: monthToFetch.toISOString(),
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
  }, [selectedMonth]);

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
        .eq("user_id", user.id);

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

  const handleCopyFromLastMonth = async () => {
    setIsCopying(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado para copiar orçamentos.");
      setIsCopying(false);
      return;
    }

    try {
      const lastMonth = subMonths(selectedMonth, 1);
      const currentMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);

      // Fetch budgets from the last month
      const { data: lastMonthBudgets, error: lastMonthError } = await supabase.rpc('get_budgets_with_spending', {
        budget_month: lastMonth.toISOString(),
      });

      if (lastMonthError) throw lastMonthError;

      if (!lastMonthBudgets || lastMonthBudgets.length === 0) {
        showError("Não há orçamentos para copiar do mês passado.");
        setIsCopying(false);
        return;
      }

      // Fetch existing budgets for the current month to avoid duplicates
      const { data: currentMonthExistingBudgets, error: currentMonthError } = await supabase
        .from("budgets")
        .select("category_id")
        .eq("user_id", user.id)
        .eq("month", currentMonthStart.toISOString().split('T')[0]);

      if (currentMonthError) throw currentMonthError;

      const existingCategoryIds = new Set(currentMonthExistingBudgets?.map(b => b.category_id));

      const budgetsToInsert = lastMonthBudgets
        .filter(budget => !existingCategoryIds.has(budget.category_id))
        .map(budget => ({
          user_id: user.id,
          category_id: budget.category_id,
          amount: budget.budgeted_amount,
          month: currentMonthStart.toISOString().split('T')[0],
        }));

      if (budgetsToInsert.length === 0) {
        showSuccess("Todos os orçamentos do mês passado já existem neste mês.");
        setIsCopying(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("budgets")
        .insert(budgetsToInsert);

      if (insertError) throw insertError;

      showSuccess(`Orçamentos copiados com sucesso! (${budgetsToInsert.length} novos orçamentos)`);
      fetchBudgets(); // Re-fetch budgets to show the new ones
    } catch (error: any) {
      showError("Erro ao copiar orçamentos: " + error.message);
      console.error("Copy budgets error:", error);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">
          Orçamentos de {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <MonthPicker selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
          <Button size="sm" className="gap-1 w-full sm:w-auto" onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>
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
              onEdit={handleEditBudget}
              onDelete={handleDeleteBudget}
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
              Crie seu primeiro orçamento ou copie do mês passado.
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Orçamento
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCopyFromLastMonth} 
                disabled={isCopying}
              >
                {isCopying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                Copiar do mês passado
              </Button>
            </div>
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
      <EditBudgetModal
        isOpen={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        onBudgetUpdated={fetchBudgets}
        budget={editingBudget}
        onDeleteRequest={handleDeleteBudget}
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