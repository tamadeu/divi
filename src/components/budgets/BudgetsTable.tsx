"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2 } from "lucide-react";
import { Budget } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
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

interface BudgetsTableProps {
  budgets: Budget[];
  onBudgetUpdated: () => void;
}

const BudgetsTable = ({ budgets, onBudgetUpdated }: BudgetsTableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
    return <Badge variant="default">No limite</Badge>;
  };

  const handleDelete = async (budgetId: string) => {
    setDeletingId(budgetId);
    
    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budgetId);

      if (error) throw error;

      showSuccess("Orçamento excluído com sucesso!");
      onBudgetUpdated();
    } catch (error: any) {
      console.error("Error deleting budget:", error);
      showError("Erro ao excluir orçamento. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  if (budgets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhum orçamento encontrado para este mês.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Crie seu primeiro orçamento clicando no botão "Novo Orçamento".
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
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
          {budgets.map((budget: any) => {
            const spent = Number(budget.spent_amount || 0);
            const budgeted = Number(budget.budgeted_amount || 0);
            const remaining = budgeted - spent;
            const percentage = getProgressPercentage(spent, budgeted);

            return (
              <TableRow key={budget.id}>
                <TableCell className="font-medium">
                  {budget.category_name}
                </TableCell>
                <TableCell>{formatCurrency(budgeted)}</TableCell>
                <TableCell>{formatCurrency(spent)}</TableCell>
                <TableCell className={remaining < 0 ? "text-red-600" : "text-green-600"}>
                  {formatCurrency(remaining)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={percentage} 
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(spent, budgeted)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === budget.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o orçamento para "{budget.category_name}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(budget.id)}
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
    </div>
  );
};

export default BudgetsTable;