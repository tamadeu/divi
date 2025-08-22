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
import { useSession } from "@/contexts/SessionContext";
import { Transaction, Company, BudgetWithSpending } from "@/types/database";
import { TransactionWithDetails } from "@/types/transaction-details";
// import EditTransactionModal from "@/components/transactions/EditTransactionModal"; // Removed
// import EditCreditCardTransactionModal from "@/components/transactions/EditCreditCardTransactionModal"; // Removed
import { format } from "date-fns"; // Import format from date-fns
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface SummaryData {
  total_balance: number;
  monthly_income: number;
  monthly_expenses: number;
}

const Dashboard = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const { openAddTransactionModal, openAddTransferModal } = useModal(); // Removed edit modals
  const { currentWorkspace } = useWorkspace();
  const { session } = useSession();
  const isMobile = useIsMobile();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const navigate = useNavigate(); // Initialize useNavigate

  const handleTransactionClick = (transaction: TransactionWithDetails) => {
    navigate(`/transactions/${transaction.id}`); // Navigate to the new page
  };

  const fetchDashboardData = useCallback(async (month: Date) => {
    if (!currentWorkspace || !session?.user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    // const nextMonthStart = new Date(month.getFullYear(), month.getMonth() + 1, 1); // Not needed with RPC filter

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

    // Fetch recent transactions for the selected month and workspace using RPC
    const { data: transactionsData, error: transactionsError } = await supabase.rpc('get_transaction_details', {
      p_user_id: session.user.id,
      p_workspace_id: currentWorkspace.id,
      p_month_filter: format(month, 'yyyy-MM'), // Filter by YYYY-MM
      p_status_filter: 'all', // Assuming no status filter for dashboard recent transactions
      p_category_name_filter: 'all', // Assuming no category filter
      p_account_type_filter: 'all', // Assuming no account type filter
    });

    if (transactionsError) {
      console.error("Error fetching recent transactions:", transactionsError);
      setTransactions([]);
    } else {
      // The RPC function already returns data in the desired flattened format
      // We just need to cast it and apply the limit
      const limitedTransactions = (transactionsData || []).slice(0, 6) as TransactionWithDetails[];
      setTransactions(limitedTransactions);
    }

    // Fetch budgets for the selected month and workspace
    const { data: budgetsData, error: budgetsError } = await supabase.rpc('get_budgets_with_spending', {
      budget_month: monthStart, // Pass Date object directly
      workspace_id_param: currentWorkspace.id // Pass workspace_id_param
    });

    if (budgetsError) {
      console.error("Error fetching budgets data:", budgetsError);
      setBudgets([]);
    } else {
      setBudgets(budgetsData || []);
    }

    setLoading(false);
  }, [currentWorkspace, session?.user]);

  useEffect(() => {
    if (currentWorkspace && session?.user) {
      fetchDashboardData(selectedMonth);
    }
  }, [fetchDashboardData, selectedMonth, currentWorkspace, session?.user]);

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return "R$ 0,00";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (!currentWorkspace || !session?.user) {
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
        <div className="space-y-3 md:space-y-0 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
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
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5 mt-4">
        <div className="lg:col-span-3">
          <RecentTransactions transactions={transactions} loading={loading} onRowClick={handleTransactionClick} companies={companies} />
        </div>
        <div className="lg:col-span-2">
          <BudgetSummaryTable budgets={budgets} loading={loading} />
        </div>
      </div>
    </>
  );
};

export default Dashboard;