import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import AddBudgetModal from "@/components/budgets/AddBudgetModal";
import EditBudgetModal from "@/components/budgets/EditBudgetModal";

interface BudgetWithSpending {
  id: string;
  category_id: string;
  category_name: string;
  budgeted_amount: number;
  spent_amount: number;
}

const Budgets = () => {
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (currentWorkspace) {
      fetchBudgets();
    }
  }, [currentWorkspace, selectedMonth]);

  const fetchBudgets = async () => {
    if (!currentWorkspace) return;

    const monthDate = new Date(selectedMonth + "-01");
    
    const { data, error } = await supabase.rpc("get_budgets_with_spending", {
      budget_month: monthDate.toISOString().split('T')[0],
      workspace_id_param: currentWorkspace.id,
    });

    if (error) {
      showError("Erro ao carregar orçamentos");
      console.error("Error fetching budgets:", error);
    } else {
      setBudgets(data || []);
    }
    setLoading(false);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", budgetId);

    if (error) {
      showError("Erro ao excluir orçamento");
    } else {
      showSuccess("Orçamento excluído com sucesso!");
      fetchBudgets();
    }
  };

  const handleEditBudget = (budget: BudgetWithSpending) => {
    setEditingBudget(budget);
    setIsEditModalOpen(true);
  };

  const handleBudgetUpdated = () => {
    fetchBudgets();
    setIsEditModalOpen(false);
    setEditingBudget(null);
  };

  const handleBudgetAdded = () => {
    fetchBudgets();
    setIsAddModalOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const getProgressPercentage = (spent: number, budgeted: number) => {
    if (budgeted === 0) return 0;
    return Math.min((spent / budgeted) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusBadge = (spent: number, budgeted: number) => {
    const percentage = getProgressPercentage(spent, budgeted);
    if (percentage >= 100) {
      return <Badge variant="destructive">Excedido</Badge>;
    }
    if (percentage >= 80) {
      return <Badge variant="secondary">Atenção</Badge>;
    }
    return <Badge variant="default">No Limite</Badge>;
  };

  // Generate month options for the last 12 months and next 12 months
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = -12; i <= 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const value = format(date, "yyyy-MM");
      const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
      options.push({ value, label });
    }
    
    return options;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Orçamentos</h1>
            <p className="text-muted-foreground">
              Controle seus gastos por categoria.
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>
        <div className="text-center py-8">Carregando orçamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">
            Controle seus gastos por categoria.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Nenhum orçamento encontrado</h3>
              <p className="text-muted-foreground">
                Comece criando seu primeiro orçamento para este mês.
              </p>
              <Button onClick={() => setIsAddModalOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="grid gap-4 md:hidden">
            {budgets.map((budget) => {
              const percentage = getProgressPercentage(budget.spent_amount, budget.budgeted_amount);
              return (
                <Card key={budget.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{budget.category_name}</CardTitle>
                        <CardDescription>
                          {formatCurrency(budget.spent_amount)} de {formatCurrency(budget.budgeted_amount)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(budget.spent_amount, budget.budgeted_amount)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progresso</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBudget(budget)}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o orçamento para "{budget.category_name}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteBudget(budget.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Orçamentos de {format(new Date(selectedMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR })}</CardTitle>
              <CardDescription>
                Acompanhe seus gastos por categoria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Orçado</TableHead>
                    <TableHead>Gasto</TableHead>
                    <TableHead>Restante</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => {
                    const remaining = budget.budgeted_amount - budget.spent_amount;
                    const percentage = getProgressPercentage(budget.spent_amount, budget.budgeted_amount);
                    
                    return (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">{budget.category_name}</TableCell>
                        <TableCell>{formatCurrency(budget.budgeted_amount)}</TableCell>
                        <TableCell>{formatCurrency(budget.spent_amount)}</TableCell>
                        <TableCell className={remaining >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(remaining)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-20 h-2" />
                            <span className="text-sm">{percentage.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(budget.spent_amount, budget.budgeted_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBudget(budget)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o orçamento para "{budget.category_name}"? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteBudget(budget.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Budget Modal */}
      <AddBudgetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBudgetAdded={handleBudgetAdded}
        selectedMonth={selectedMonth}
      />

      {/* Edit Budget Modal */}
      {editingBudget && (
        <EditBudgetModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBudget(null);
          }}
          budget={editingBudget}
          onBudgetUpdated={handleBudgetUpdated}
          selectedMonth={selectedMonth}
        />
      )}
    </div>
  );
};

export default Budgets;