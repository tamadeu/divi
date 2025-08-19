import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BudgetWithSpending } from "@/types/database";

interface BudgetItemProps {
  budget: BudgetWithSpending;
}

const BudgetItem = ({ budget }: BudgetItemProps) => {
  const progress = (budget.spent_amount / budget.budgeted_amount) * 100;
  const remaining = budget.budgeted_amount - budget.spent_amount;

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{budget.category_name}</CardTitle>
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