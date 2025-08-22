import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Transaction, Company } from "@/types/database";
import { TransactionWithDetails } from "@/types/transaction-details"; // Import new type
import AllTransactionsTable from "@/components/transactions/AllTransactionsTable";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import TransferModal from "@/components/transfers/TransferModal";
import { showError } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext"; // Import useModal
import EditCreditCardTransactionModal from "@/components/transactions/EditCreditCardTransactionModal"; // New import
import SummaryCard from "@/components/dashboard/SummaryCard"; // Imported SummaryCard
import MobileIncomeExpenseSummaryCards from "@/components/dashboard/MobileIncomeExpenseSummaryCards"; // Imported new component
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import { useWorkspace } from "@/contexts/WorkspaceContext"; // Import useWorkspace
import { useSession } from "@/contexts/SessionContext"; // Import useSession
import { format } from "date-fns"; // Import format

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [allFetchedTransactions, setAllFetchedTransactions] = useState<TransactionWithDetails[]>([]); // All transactions from RPC
  const [filteredResults, setFilteredResults] = useState<TransactionWithDetails[]>([]); // Results after client-side filtering
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { openEditTransactionModal, openEditCreditCardTransactionModal } = useModal(); // Use modal functions
  const isMobile = useIsMobile(); // Use useIsMobile hook
  const { currentWorkspace } = useWorkspace(); // Use useWorkspace hook
  const { session } = useSession(); // Use session

  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [loadingSummary, setLoadingSummary] = useState(true); // New state for summary loading

  // Gerar lista de meses para o filtro
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    // Adicionar os últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = format(date, 'yyyy-MM'); // Use format for consistency
      const monthLabel = date.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      months.push({
        value: monthKey,
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
      });
    }
    
    return months;
  };

  const monthOptions = generateMonthOptions();

  const fetchSearchResults = useCallback(async () => {
    if (!query || !currentWorkspace || !session?.user) { // Add currentWorkspace and session.user check
      setAllFetchedTransactions([]);
      setLoading(false);
      setLoadingSummary(false); // Set summary loading to false as well
      return;
    }
    setLoading(true);
    setLoadingSummary(true); // Start summary loading

    try {
      // Fetch companies first
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("name, logo_url");
      if (companiesError) {
        console.error("Error fetching companies:", companiesError);
      } else {
        setCompanies(companiesData || []);
      }

      // Fetch all transactions for the current workspace and user using RPC
      const rpcArgs: {
        p_user_id: string;
        p_workspace_id: string;
        p_month_filter?: string;
      } = {
        p_user_id: session.user.id,
        p_workspace_id: currentWorkspace.id,
      };

      if (selectedMonth !== "all") {
        rpcArgs.p_month_filter = selectedMonth;
      }

      const { data: transactionsData, error: transactionsError } = await supabase.rpc('get_transaction_details', rpcArgs);

      if (transactionsError) {
        console.error("Error fetching detailed transactions:", transactionsError);
        setAllFetchedTransactions([]);
      } else {
        setAllFetchedTransactions(transactionsData || []);
      }

    } catch (error) {
      console.error("Error in search:", error);
      setAllFetchedTransactions([]);
    }

    setLoading(false);
    setLoadingSummary(false); // End summary loading
  }, [query, currentWorkspace, session?.user, selectedMonth]); // Add selectedMonth to dependencies

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Filtrar resultados por query e mês (client-side for query)
  useEffect(() => {
    let results = allFetchedTransactions;

    // Apply query filter client-side
    if (query) {
      const searchLower = query.toLowerCase();
      results = results.filter(transaction => {
        const nameMatch = transaction.name.toLowerCase().includes(searchLower);
        const descriptionMatch = transaction.description?.toLowerCase().includes(searchLower);
        const categoryMatch = transaction.category_name?.toLowerCase().includes(searchLower);
        return nameMatch || descriptionMatch || categoryMatch;
      });
    }
    
    // Month filter is already applied by RPC, but if 'all' is selected, we use allFetchedTransactions
    // If selectedMonth is 'all', allFetchedTransactions already contains all months.
    // If selectedMonth is specific, allFetchedTransactions already contains only that month.
    // So, no additional month filtering needed here.

    setFilteredResults(results);
  }, [allFetchedTransactions, query]);

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
    } else if (transaction.credit_card_bill_id) { // Check for credit card transaction
      openEditCreditCardTransactionModal(transaction);
    } else {
      openEditTransactionModal(transaction);
    }
  };

  // Calcular totais baseado nos resultados filtrados
  const totalIncome = filteredResults
    .filter(t => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = filteredResults
    .filter(t => Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!currentWorkspace || !session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Nenhum núcleo financeiro selecionado</h2>
          <p className="text-muted-foreground">Selecione um núcleo financeiro para ver os resultados da busca.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filtro de Mês */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtrar por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Selecione um mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Cards de Resumo - Usando os novos componentes */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        isMobile ? (
          <MobileIncomeExpenseSummaryCards
            monthlyIncome={totalIncome}
            monthlyExpenses={totalExpenses}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <SummaryCard
              title="Renda Total"
              value={formatCurrency(totalIncome)}
              icon={TrendingUp}
              variant="income"
            />
            <SummaryCard
              title="Despesas Totais"
              value={formatCurrency(totalExpenses)}
              icon={TrendingDown}
              variant="expense"
            />
          </div>
        )
      )}

      {/* Card de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados da Busca</CardTitle>
          <CardDescription>
            {loading
              ? "Buscando..."
              : filteredResults.length > 0
              ? `Exibindo ${filteredResults.length} resultado(s) para `
              : `Nenhum resultado encontrado para `}
            <span className="font-semibold">"{query}"</span>
            {selectedMonth !== "all" && (
              <span className="text-muted-foreground">
                {" "}em {monthOptions.find(m => m.value === selectedMonth)?.label.toLowerCase()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <AllTransactionsTable
              transactions={filteredResults}
              onRowClick={handleRowClick}
              companies={companies}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default SearchResultsPage;