import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetWithSpending } from "@/types/database";

interface BudgetSummaryTableProps {
  budgets: BudgetWithSpending[];
  loading: boolean;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BudgetSummaryTable = ({ budgets, loading }: BudgetSummaryTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamentos Mensais</CardTitle>
        <CardDescription>Visão geral dos seus orçamentos para o mês atual.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : budgets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const progress = (budget.spent_amount / budget.budgeted_amount) * 100;
                const remaining = budget.budgeted_amount - budget.spent_amount;
                return (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.category_name}</TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Gasto: {formatCurrency(budget.spent_amount)}</span>
                          <span>Restante: {formatCurrency(remaining)}</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            Nenhum orçamento definido para este mês.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetSummaryTable;