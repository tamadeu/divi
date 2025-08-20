import SummaryCard from "@/components/dashboard/SummaryCard";
import MobileSummaryCards from "@/components/dashboard/MobileSummaryCards";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BudgetSummaryTable from "@/components/dashboard/BudgetSummaryTable";
import MonthPicker from "@/components/budgets/MonthPicker";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Transaction, Company, BudgetWithSpending } from "@/types/database";
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
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const { openAddTransactionModal, openAddTransferModal } = useModal();
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const fetchDashboardData = useCallback(async (month: Date) => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const nextMonthStart = new Date(month.getFullYear(), month.getMonth() + 1, 1);

    // Fetch companies
    const { data: companiesData, error: companiesError } = await supabase
      .from("companies")
      .select("name, logo_url");
    if (companiesError) {
      console.error("Error fetching companies:", companiesError);
    } else {
      setCompanies(companiesData || []);
    }

    // Fetch summary for the selected month and workspace
    const { data: summaryData, error: summaryError } = await supabase.rpc('get_dashboard_summary', {
      summary_month: monthStart.toISOString(),
      workspace_id_param: currentWorkspace.id
    });
    if (summaryError) {
      console.error("Error fetching summary data:", summaryError);
      setSummary({ total_balance: 0, monthly_income: 0, monthly_expenses: 0 });
    } else if (summaryData && summaryData.length > 0) {
      setSummary(summaryData[0]);
    }

    // Fetch recent transactions for the selected month and workspace
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
      .eq("workspace_id", currentWorkspace.id)
      .gte("date", monthStart.toISOString())
      .lt("date", nextMonthStart.toISOString())
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

    // Fetch budgets for the selected month and workspace
    const { data: budgetsData, error: budgetsError } = await supabase.rpc('get_budgets_with_spending', {
      budget_month: monthStart.toISOString(),
    });

    if (budgetsError) {
      console.error("Error fetching budgets data:", budgetsError);
      setBudgets([]);
    } else {
      // Filter budgets by workspace (since the RPC doesn't support workspace filtering yet)
      const workspaceBudgets = budgetsData?.filter((budget: any) => {
        // We'll need to check if the budget belongs to the current workspace
        // For now, we'll show all budgets until we update the RPC function
        return true;
      }) || [];
      setBudgets(workspaceBudgets);
    }

    setLoading(false);
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchDashboardData(selectedMonth);
    }
  }, [fetchDashboardData, selectedMonth, currentWorkspace]);

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return "R$ 0,00";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <Skeleton className="w-32 h-8" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Painel</h1>
        <MonthPicker selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
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
          <BudgetSummaryTable budgets={budgets} loading={loading} />
        </div>
      </div>

      <EditTransactionModal
        transaction={selectedTransaction}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onTransactionUpdated={() => fetchDashboardData(selectedMonth)}
      />
    </>
  );
};

export default Dashboard;