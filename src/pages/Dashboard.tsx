import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import SummaryCard from "@/components/dashboard/SummaryCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import SpendingChart from "@/components/dashboard/SpendingChart";
import { summaryData } from "@/data/mockData";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Painel</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SummaryCard
              title="Saldo Total"
              value={summaryData.totalBalance.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              icon={DollarSign}
              variant="default"
            />
            <SummaryCard
              title="Renda Mensal"
              value={summaryData.monthlyIncome.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              icon={TrendingUp}
              variant="income"
            />
            <SummaryCard
              title="Despesas Mensais"
              value={summaryData.monthlyExpenses.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              icon={TrendingDown}
              variant="expense"
            />
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RecentTransactions />
            </div>
            <div className="lg:col-span-2">
              <SpendingChart />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;