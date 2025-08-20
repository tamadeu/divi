import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BudgetWithSpending } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface BudgetItemProps {
  budget: BudgetWithSpending;
  onEdit: (budget: BudgetWithSpending) => void;
  onDelete: (budget: BudgetWithSpending) => void;
}

const BudgetItem = ({ budget, onEdit, onDelete }: BudgetItemProps) => {
  const progress = (budget.spent_amount / budget.budgeted_amount) * 100;
  const remaining = budget.budgeted_amount - budget.spent_amount;

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{budget.category_name}</CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(budget)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => onDelete(budget)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Gasto: {formatCurrency(budget.spent_amount)}</span>
          <span>Restante: {formatCurrency(remaining)}</span>
        </div>
        <div className="text-right text-sm font-medium">
          Orçamento Total: {formatCurrency(budget.budgeted_amount)}
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetItem;