import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Transaction, Company } from "@/types/database";
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
import { PlusCircle, ArrowRightLeft, Filter } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import VoiceTransactionButton from "@/components/transactions/VoiceTransactionButton";
import { getCompanyLogo } from "@/utils/transaction-helpers";
import { useIsMobile } from "@/hooks/use-mobile";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import TransferModal from "@/components/transfers/TransferModal";
import { showError } from "@/utils/toast";
import TransactionFiltersSheet from "@/components/transactions/TransactionFiltersSheet";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import SummaryCards from "@/components/SummaryCards"; // Importando o novo componente

const ITEMS_PER_PAGE = 10;

const TransactionsPage = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransferData, setSelectedTransferData] = useState<{ fromTransaction: Transaction, toTransaction: Transaction } | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const { openAddTransactionModal, openAddTransferModal } = useModal();
  const isMobile = useIsMobile();

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
    setLoadingSummary(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoadingSummary(false);
      return;
    }

    const rpcArgs: {
      summary_month?: string;
      filter_status?: string;
      filter_category_name?: string;
      filter_account_type?: string;
    } = {};

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
  }, [monthFilter, statusFilter, categoryFilter, accountTypeFilter]); // Adicionado todos os filtros como dependências

  const fetchTransactions = async () => {
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

    // Fetch transactions
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        id,
        account_id,
        date,
        name,
        amount,
        status,
        description,
        category_id,
        category:categories (name),
        account:accounts (name, type),
        transfer_id
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else {
      const formattedData = data.map((t: any) => ({
        ...t,
        category: t.category?.name || "Sem categoria",
        account: t.account,
      }));
      setAllTransactions(formattedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []); // Dependência vazia para carregar transações apenas uma vez

  useEffect(() => {
    fetchSummaryData();
  }, [monthFilter, statusFilter, categoryFilter, accountTypeFilter, fetchSummaryData]); // Recarrega o resumo quando qualquer filtro relevante muda

  const uniqueCategories = useMemo(() => {
    const categories = new Set(allTransactions.map((t) => t.category).filter(Boolean));
    return Array.from(categories).sort() as string[];
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((transaction) => {
      const searchMatch =
        searchQuery.toLowerCase() === "" ||
        transaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const statusMatch =
        statusFilter === "all" || transaction.status === statusFilter;
      const categoryMatch =
        categoryFilter === "all" || transaction.category === categoryFilter;
      
      const accountTypeMatch =
        accountTypeFilter === "all" || transaction.account?.type === accountTypeFilter;

      // Novo filtro de mês
      const monthMatch =
        monthFilter === "all" ||
        format(new Date(transaction.date), 'yyyy-MM') === monthFilter;

      return searchMatch && statusMatch && categoryMatch && accountTypeMatch && monthMatch;
    });
  }, [allTransactions, searchQuery, monthFilter, statusFilter, categoryFilter, accountTypeFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handleRowClick = async (transaction: Transaction) => {
    if (transaction.transfer_id) {
      // Fetch both transactions related to this transfer_id
      const { data: transferTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transfer_id', transaction.transfer_id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        showError("Erro ao carregar detalhes da transferência: " + error.message);
        return;
      }

      if (transferTransactions && transferTransactions.length === 2) {
        const fromTransaction = transferTransactions.find(t => t.amount < 0);
        const toTransaction = transferTransactions.find(t => t.amount > 0);

        if (fromTransaction && toTransaction) {
          setSelectedTransferData({ fromTransaction, toTransaction });
          setIsTransferModalOpen(true);
        } else {
          showError("Não foi possível identificar as transações de origem e destino da transferência.");
        }
      } else {
        showError("Não foi possível encontrar as duas transações para esta transferência.");
      }
    } else {
      setSelectedTransaction(transaction);
      setIsEditModalOpen(true);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => setSelectedTransaction(null), 300);
    fetchTransactions(); // Recarrega as transações após edição/exclusão
    fetchSummaryData(); // Recarrega o resumo também
  };

  const closeTransferModal = () => {
    setIsTransferModalOpen(false);
    setTimeout(() => setSelectedTransferData(null), 300);
    fetchTransactions(); // Recarrega as transações após transferência
    fetchSummaryData(); // Recarrega o resumo também
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters are applied
    fetchSummaryData(); // Recarrega o resumo com os novos filtros
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">Transações</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Todas as Transações</CardTitle>
          <CardDescription>
            Uma lista de todas as suas transações. Clique em uma linha para ver os detalhes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SummaryCards 
            totalBalance={totalBalance}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            loading={loadingSummary}
          />
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
                onEditTransaction={handleRowClick}
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
      <EditTransactionModal
        transaction={selectedTransaction}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onTransactionUpdated={fetchTransactions}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={closeTransferModal}
        onTransferCompleted={fetchTransactions}
        initialTransferData={selectedTransferData}
      />
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