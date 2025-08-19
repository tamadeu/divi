import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import IncomeExpenseChart from "@/components/reports/IncomeExpenseChart";
import SpendingChart from "@/components/dashboard/SpendingChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ReportsPage = () => {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
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
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;