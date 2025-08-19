import SummaryCard from "@/components/dashboard/SummaryCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import SpendingChart from "@/components/dashboard/SpendingChart";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

interface SummaryData {
  total_balance: number;
  monthly_income: number;
  monthly_expenses: number;
}

const Dashboard = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_dashboard_summary');
      
      if (error) {
        console.error("Error fetching summary data:", error);
        setSummary({ total_balance: 0, monthly_income: 0, monthly_expenses: 0 });
      } else if (data && data.length > 0) {
        setSummary(data[0]);
      }
      setLoading(false);
    };

    fetchSummary();
  }, []);

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return "R$ 0,00";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Painel</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <SummaryCard
              title="Saldo Total"
              value={formatCurrency(summary?.total_balance)}
              icon={DollarSign}
              variant="default"
            />
            <SummaryCard
              title="Renda Mensal"
              value={formatCurrency(summary?.monthly_income)}
              icon={TrendingUp}
              variant="income"
            />
            <SummaryCard
              title="Despesas Mensais"
              value={formatCurrency(summary?.monthly_expenses)}
              icon={TrendingDown}
              variant="expense"
            />
          </>
        )}
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentTransactions />
        </div>
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
      </div>
    </>
  );
};

export default Dashboard;