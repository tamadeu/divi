import IncomeExpenseChart from "@/components/reports/IncomeExpenseChart";
import SpendingChart from "@/components/dashboard/SpendingChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ReportsPage = () => {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Relatórios</h1>
      </div>
      <div className="grid gap-6">
        <IncomeExpenseChart />
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria (Mês Atual)</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ReportsPage;