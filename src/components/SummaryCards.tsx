import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  loading: boolean;
  showTotalBalance?: boolean;
}

const SummaryCards = ({ totalBalance, monthlyIncome, monthlyExpenses, loading, showTotalBalance = true }: SummaryCardsProps) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const gridClasses = cn(
    "grid gap-4 mb-6",
    showTotalBalance ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-2" // Alterado para grid-cols-2 para mobile
  );

  if (loading) {
    return (
      <div className={gridClasses}>
        {showTotalBalance && <Card className="h-[120px] animate-pulse bg-gray-100"></Card>}
        <Card className="h-[120px] animate-pulse bg-gray-100"></Card>
        <Card className="h-[120px] animate-pulse bg-gray-100"></Card>
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {showTotalBalance && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Saldo atual em todas as contas incluídas.
            </p>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Receitas
          </CardTitle>
          <ArrowUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(monthlyIncome)}</div>
          <p className="text-xs text-muted-foreground">
            Renda do mês selecionado.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Despesas
          </CardTitle>
          <ArrowDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(monthlyExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            Despesas do mês selecionado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;