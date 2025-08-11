import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Budget } from "@/data/mockData";

interface BudgetItemProps {
  budget: Budget;
}

const BudgetItem = ({ budget }: BudgetItemProps) => {
  const progress = (budget.spent / budget.budgeted) * 100;
  const remaining = budget.budgeted - budget.spent;

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{budget.category}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Gasto: {formatCurrency(budget.spent)}</span>
          <span>Restante: {formatCurrency(remaining)}</span>
        </div>
        <div className="text-right text-sm font-medium">
          Orçamento Total: {formatCurrency(budget.budgeted)}
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetItem;