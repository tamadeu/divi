import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Transaction, Company } from "@/types/database";
import { TransactionWithDetails } from "@/types/transaction-details";
import AllTransactionsTable from "@/components/transactions/AllTransactionsTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowRightLeft, Filter, TrendingUp, TrendingDown } from "lucide-react"; // Added TrendingUp, TrendingDown
import { useModal } from "@/contexts/ModalContext";
import VoiceTransactionButton from "@/components/transactions/VoiceTransactionButton";
import { getCompanyLogo } from "@/utils/transaction-helpers";
import { useIsMobile } from "@/hooks/use-mobile";
// import EditTransactionModal from "@/components/transactions/EditTransactionModal"; // Removed
import TransferModal from "@/components/transfers/TransferModal";
import { showError } from "@/utils/toast";
import TransactionFiltersSheet from "@/components/transactions/TransactionFiltersSheet";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import SummaryCard from "@/components/dashboard/SummaryCard"; // Imported SummaryCard
import MobileIncomeExpenseSummaryCards from "@/components/dashboard/MobileIncomeExpenseSummaryCards"; // Imported new component
import { useWorkspace } from "@/contexts/WorkspaceContext";
// import EditCreditCardTransactionModal from "@/components/transactions/EditCreditCardTransactionModal"; // Removed
import { useSession } from "@/contexts/SessionContext"; // Import useSession
import { useNavigate } from "react-router-dom"; // Import useNavigate

const ITEMS_PER_PAGE = 10;

// Helper function for currency formatting
const formatCurrency = (value: number | undefined) => {
  if (typeof value !== 'number') return "R$ 0,00";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const TransactionsPage = () => {
  const [allTransactions, setAllTransactions] = useState<TransactionWithDetails[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { openAddTransactionModal, openAddTransferModal } = useModal(); // Removed edit modals
  const { currentWorkspace } = useWorkspace();
  const { session } = useSession(); // Use session
  const isMobile = useIsMobile();
  const navigate = useNavigate(); // Initialize useNavigate

  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Estados para os dados de resumo
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const fetchSummaryData = useCallback(async () => {
    if (!currentWorkspace || !session?.user) {
      setLoadingSummary(false);
      return;
    }

    setLoadingSummary(true);
    
    const rpcArgs: {
      summary_month?: string;
      filter_status?: string;
      filter_category_name?: string;
      filter_account_type?: string;
      workspace_id_param?: string;
    } = {
      workspace_id_param: currentWorkspace.id
    };

    if (monthFilter !== "all") {
      const [year, month] = monthFilter.split('-');
      rpcArgs.summary_month = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    }
    if (statusFilter !== "all") {
      rpcArgs.filter_status = statusFilter;
    }
    if (categoryFilter !== "all") {
      rpcArgs.filter_category_name = categoryFilter;
    }
    if (accountTypeFilter !== "all") {
      rpcArgs.filter_account_type = accountTypeFilter;
    }

    const { data, error } = await supabase.rpc('get_dashboard_summary', rpcArgs);

    if (error) {
      console.error("Error fetching dashboard summary:", error);
      showError("Erro ao carregar o resumo do dashboard.");
      setLoadingSummary(false);
      return;
    }
    
    const summaryData = data[0];

    if (summaryData) {
      setTotalBalance(summaryData.total_balance || 0);
      setMonthlyIncome(summaryData.monthly_income || 0);
      setMonthlyExpenses(Math.abs(summaryData.monthly_expenses || 0));
    }
    setLoadingSummary(false);
  }, [monthFilter, statusFilter, categoryFilter, accountTypeFilter, currentWorkspace, session?.user]);

  const fetchTransactions = useCallback(async () => {
    if (!currentWorkspace || !session?.user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Fetch companies
    const { data: companiesData, error: companiesError } = await supabase
      .from("companies")
      .select("name, logo_url");
    if (companiesError) {
      console.error("Error fetching companies:", companiesError);
    } else {
      setCompanies(companiesData || []);
    }

    // Fetch transactions using RPC
    const rpcArgs: {
      p_user_id: string;
      p_workspace_id: string;
      p_month_filter?: string;
      p_status_filter?: string;
      p_category_name_filter?: string;
      p_account_type_filter?: string;
    } = {
      p_user_id: session.user.id,
      p_workspace_id: currentWorkspace.id,
    };

    if (monthFilter !== "all") {
      rpcArgs.p_month_filter = monthFilter;
    }
    if (statusFilter !== "all") {
      rpcArgs.p_status_filter = statusFilter;
    }
    if (categoryFilter !== "all") {
      rpcArgs.p_category_name_filter = categoryFilter;
    }
    if (accountTypeFilter !== "all") {
      rpcArgs.p_account_type_filter = accountTypeFilter;
    }

    const { data, error } = await supabase.rpc('get_transaction_details', rpcArgs);

    if (error) {
      console.error("Error fetching transactions:", error);
      setAllTransactions([]);
    } else {
      // The RPC function already returns data in the desired flattened format
      setAllTransactions(data || []);
    }
    setLoading(false);
  }, [currentWorkspace, session?.user, monthFilter, statusFilter, categoryFilter, accountTypeFilter]); // Added filters to dependencies

  useEffect(() => {
    if (currentWorkspace && session?.user) {
      fetchTransactions();
    }
  }, [currentWorkspace, session?.user, fetchTransactions]);

  useEffect(() => {
    if (currentWorkspace && session?.user) {
      fetchSummaryData();
    }
  }, [monthFilter, statusFilter, categoryFilter, accountTypeFilter, currentWorkspace, session?.user, fetchSummaryData]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(allTransactions.map((t) => t.category_name).filter(Boolean));
    return Array.from(categories).sort() as string[];
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((transaction) => {
      const searchMatch =
        searchQuery.toLowerCase() === "" ||
        transaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Month, status, category, and account type filters are now handled by the RPC call
      // We only need to apply the search query filter here.
      return searchMatch;
    });
  }, [allTransactions, searchQuery]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handleRowClick = async (transaction: TransactionWithDetails) => { // Updated type here
    if (transaction.transfer_id) {
      // Fetch both transactions related to this transfer_id
      const { data: transferTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transfer_id', transaction.transfer_id)
        .eq('user_id', session?.user?.id); // Use session.user.id

      if (error) {
        showError("Erro ao carregar detalhes da transferência: " + error.message);
        return;
      }

      if (transferTransactions && transferTransactions.length === 2) {
        const fromTransaction = transferTransactions.find(t => t.amount < 0);
        const toTransaction = transferTransactions.find(t => t.amount > 0);

        if (fromTransaction && toTransaction) {
          // Need to cast to Transaction type for the modal
          openAddTransferModal({
            fromAccountId: fromTransaction.account_id || undefined,
            toAccountId: toTransaction.account_id || undefined,
            amount: Math.abs(fromTransaction.amount) || undefined,
          });
        } else {
          showError("Não foi possível identificar as transações de origem e destino da transferência.");
        }
      } else {
        showError("Não foi possível encontrar as duas transações para esta transferência.");
      }
    } else {
      navigate(`/transactions/${transaction.id}`); // Navigate to the new page
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters are applied
    fetchTransactions(); // Re-fetch transactions with new filters
    fetchSummaryData(); // Recarrega o resumo com os novos filtros
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!currentWorkspace || !session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Nenhum núcleo financeiro selecionado</h2>
          <p className="text-muted-foreground">Selecione um núcleo financeiro para ver suas transações.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Transações</h1>
      </div>

      {/* Conditional rendering for summary cards - MOVED OUTSIDE THE MAIN CARD */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        isMobile ? (
          <MobileIncomeExpenseSummaryCards
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <SummaryCard
              title="Renda Mensal"
              value={formatCurrency(monthlyIncome)}
              icon={TrendingUp}
              variant="income"
            />
            <SummaryCard
              title="Despesas Mensais"
              value={formatCurrency(Math.abs(monthlyExpenses))}
              icon={TrendingDown}
              variant="expense"
            />
          </div>
        )
      )}

      <Card>
        <CardHeader>
          <CardTitle>Todas as Transações</CardTitle>
          <CardDescription>
            Uma lista de todas as suas transações. Clique em uma linha para ver os detalhes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              {isMobile ? (
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Pesquisar por nome ou descrição..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFilterSheetOpen(true)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <Input
                    placeholder="Pesquisar por nome ou descrição..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="lg:col-span-2"
                  />
                  {/* Filtro de Mês para Desktop */}
                  <Select
                    value={monthFilter}
                    onValueChange={(value) => {
                      setMonthFilter(value);
                      setCurrentPage(1);
                      handleApplyFilters(); // Apply filters immediately
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Meses</SelectItem>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const month = subMonths(new Date(), i);
                        const value = format(month, 'yyyy-MM');
                        const label = format(month, 'MMMM yyyy', { locale: ptBR });
                        return (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                      handleApplyFilters(); // Apply filters immediately
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Falhou">Falhou</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) => {
                      setCategoryFilter(value);
                      setCurrentPage(1);
                      handleApplyFilters(); // Apply filters immediately
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Categorias</SelectItem>
                      {uniqueCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={accountTypeFilter}
                    onValueChange={(value) => {
                      setAccountTypeFilter(value);
                      setCurrentPage(1);
                      handleApplyFilters(); // Apply filters immediately
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por tipo de conta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Tipos de Conta</SelectItem>
                      <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                      <SelectItem value="Poupança">Poupança</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Investimento">Investimento</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <AllTransactionsTable
                transactions={paginatedTransactions}
                companies={companies}
              />
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage - 1);
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-4 text-sm">
                          Página {currentPage} de {totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage + 1);
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <TransactionFiltersSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        monthFilter={monthFilter}
        setMonthFilter={(value) => {
          setMonthFilter(value);
          setCurrentPage(1); // Reset page when month filter changes
        }}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        accountTypeFilter={accountTypeFilter}
        setAccountTypeFilter={setAccountTypeFilter}
        uniqueCategories={uniqueCategories}
        onApplyFilters={handleApplyFilters}
      />
    </>
  );
};

export default TransactionsPage;