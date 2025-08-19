import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import BudgetItem from "@/components/budgets/BudgetItem";
import { budgetsData } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const BudgetsPage = () => {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold md:text-2xl">Orçamentos</h1>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {budgetsData.map((budget) => (
              <BudgetItem key={budget.id} budget={budget} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BudgetsPage;