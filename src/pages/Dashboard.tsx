import SummaryCard from "@/components/dashboard/SummaryCard";
import MobileSummaryCards from "@/components/dashboard/MobileSummaryCards";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BudgetSummaryTable from "@/components/dashboard/BudgetSummaryTable"; // Importar o novo componente
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Transaction, Company, BudgetWithSpending } from "@/types/database"; // Adicionar BudgetWithSpending
import EditTransactionModal from "@/components/transactions/EditTransactionModal";

interface SummaryData {
  total_balance: number;
  monthly_income: number;
  monthly_expenses: number;
}

const Dashboard = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]); // Novo estado para orçamentos
  const [loading, setLoading] = useState(true);
  const { openAddTransactionModal, openAddTransferModal } = useModal();
  const isMobile = useIsMobile();

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch companies
    const { data: companiesData, error: companiesError } = await supabase
      .from("companies")
      .select("name, logo_url");
    if (companiesError) {
      console.error("Error fetching companies:", companiesError);
    } else {
      setCompanies(companiesData || []);
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
        category:categories (name),
        transfer_id
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

    // Fetch budgets for the current month
    const currentMonth = new Date();
    currentMonth.setDate(1); // Define para o primeiro dia do mês
    currentMonth.setHours(0, 0, 0, 0); // Zera o tempo para evitar problemas com o RPC
    const { data: budgetsData, error: budgetsError } = await supabase.rpc('get_budgets_with_spending', {
      budget_month: currentMonth.toISOString(),
    });

    if (budgetsError) {
      console.error("Error fetching budgets data:", budgetsError);
      setBudgets([]);
    } else {
      setBudgets(budgetsData || []);
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
      </div>
      {loading ? (
        <div className="space-y-3 md:space-y-0 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24 md:hidden" />
          <div className="grid grid-cols-2 gap-3 md:hidden">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-24 hidden md:block" />
          <Skeleton className="h-24 hidden lg:block" />
        </div>
      ) : (
        isMobile ? (
          <MobileSummaryCards
            totalBalance={summary?.total_balance || 0}
            monthlyIncome={summary?.monthly_income || 0}
            monthlyExpenses={summary?.monthly_expenses || 0}
          />
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
          <RecentTransactions transactions={transactions} loading={loading} onRowClick={handleTransactionClick} companies={companies} />
        </div>
        <div className="lg:col-span-2">
          {/* Substituindo SpendingChart por BudgetSummaryTable */}
          <BudgetSummaryTable budgets={budgets} loading={loading} />
        </div>
      </div>

      <EditTransactionModal
        transaction={selectedTransaction}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onTransactionUpdated={fetchDashboardData}
      />
    </>
  );
};

export default Dashboard;