import SummaryCard from "@/components/dashboard/SummaryCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import SpendingChart from "@/components/dashboard/SpendingChart";
import { DollarSign, TrendingUp, TrendingDown, PlusCircle, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/ModalContext";
import VoiceTransactionButton from "@/components/transactions/VoiceTransactionButton";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

interface SummaryData {
  total_balance: number;
  monthly_income: number;
  monthly_expenses: number;
}

const Dashboard = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { openAddTransactionModal, openAddTransferModal } = useModal();
  const isMobile = useIsMobile();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch summary
    const { data: summaryData, error: summaryError } = await supabase.rpc('get_dashboard_summary');
    if (summaryError) {
      console.error("Error fetching summary data:", summaryError);
      setSummary({ total_balance: 0, monthly_income: 0, monthly_expenses: 0 });
    } else if (summaryData && summaryData.length > 0) {
      setSummary(summaryData[0]);
    }

    // Fetch recent transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select(`
        id,
        account_id,
        date,
        name,
        amount,
        status,
        description,
        category:categories (name)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(6);

    if (transactionsError) {
      console.error("Error fetching recent transactions:", transactionsError);
    } else {
      const formattedData = transactionsData.map((t: any) => ({
        ...t,
        category: t.category?.name || "Sem categoria",
      }));
      setTransactions(formattedData);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return "R$ 0,00";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Painel</h1>
        <div className="hidden md:flex gap-2">
           <VoiceTransactionButton />
           <Button size="sm" variant="outline" className="gap-1" onClick={() => openAddTransferModal(fetchDashboardData)}>
            <ArrowRightLeft className="h-4 w-4" />
            Transferência
          </Button>
          <Button size="sm" className="gap-1" onClick={() => openAddTransactionModal(fetchDashboardData)}>
            <PlusCircle className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        isMobile ? (
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              <CarouselItem className="pl-4 basis-full">
                <SummaryCard
                  title="Saldo Total"
                  value={formatCurrency(summary?.total_balance)}
                  icon={DollarSign}
                  variant="default"
                />
              </CarouselItem>
              <CarouselItem className="pl-4 basis-full">
                <SummaryCard
                  title="Renda Mensal"
                  value={formatCurrency(summary?.monthly_income)}
                  icon={TrendingUp}
                  variant="income"
                />
              </CarouselItem>
              <CarouselItem className="pl-4 basis-full">
                <SummaryCard
                  title="Despesas Mensais"
                  value={formatCurrency(Math.abs(summary?.monthly_expenses || 0))}
                  icon={TrendingDown}
                  variant="expense"
                />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              value={formatCurrency(Math.abs(summary?.monthly_expenses || 0))}
              icon={TrendingDown}
              variant="expense"
            />
          </div>
        )
      )}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentTransactions transactions={transactions} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
      </div>
    </>
  );
};

export default Dashboard;