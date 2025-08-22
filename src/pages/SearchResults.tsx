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

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchResults, setSearchResults] = useState<TransactionWithDetails[]>([]); // Use new type
  const [filteredResults, setFilteredResults] = useState<TransactionWithDetails[]>([]); // Use new type
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransferData, setSelectedTransferData] = useState<{ fromTransaction: Transaction, toTransaction: Transaction } | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [loadingSummary, setLoadingSummary] = useState(true); // New state for summary loading

  const { openEditTransactionModal, openEditCreditCardTransactionModal } = useModal(); // Use modal functions
  const isMobile = useIsMobile(); // Use useIsMobile hook
  const { currentWorkspace } = useWorkspace(); // Use useWorkspace hook

  // Gerar lista de meses para o filtro
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    // Adicionar os últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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
    if (!query || !currentWorkspace) { // Add currentWorkspace check
      setSearchResults([]);
      setLoading(false);
      setLoadingSummary(false); // Set summary loading to false as well
      return;
    }
    setLoading(true);
    setLoadingSummary(true); // Start summary loading

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setLoadingSummary(false); // Set summary loading to false as well
      return;
    }

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

      // Busca 1: Transações por nome e descrição
      const { data: transactionData, error: transactionError } = await supabase
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
          installment_number,
          total_installments,
          category:categories (name),
          transfer_id,
          credit_card_bill_id,
          credit_card_bill:credit_card_bills (
            id,
            reference_month,
            closing_date,
            due_date,
            status,
            credit_card:credit_cards (
              name,
              brand,
              last_four_digits
            )
          )
        `)
        .eq("workspace_id", currentWorkspace.id) // Filter by current workspace
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

      if (transactionError) {
        console.error("Error fetching transactions:", transactionError);
      }

      // Busca 2: Categorias que correspondem à busca
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("workspace_id", currentWorkspace.id) // Filter by current workspace
        .ilike("name", `%${query}%`);

      if (categoryError) {
        console.error("Error fetching categories:", categoryError);
      }

      // Busca 3: Transações das categorias encontradas
      let categoryTransactionData = [];
      if (categoryData && categoryData.length > 0) {
        const categoryIds = categoryData.map(cat => cat.id);
        const { data: catTransData, error: catTransError } = await supabase
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
            installment_number,
            total_installments,
            category:categories (name),
            transfer_id,
            credit_card_bill_id,
            credit_card_bill:credit_card_bills (
              id,
              reference_month,
              closing_date,
              due_date,
              status,
              credit_card:credit_cards (
                name,
                brand,
                last_four_digits
              )
            )
          `)
          .eq("workspace_id", currentWorkspace.id) // Filter by current workspace
          .in("category_id", categoryIds);

        if (catTransError) {
          console.error("Error fetching category transactions:", catTransError);
        } else {
          categoryTransactionData = catTransData || [];
        }
      }

      // Combinar e remover duplicatas
      const allTransactions = [
        ...(transactionData || []),
        ...categoryTransactionData
      ];

      // Remover duplicatas baseado no ID
      const uniqueTransactions = allTransactions.filter((transaction, index, self) =>
        index === self.findIndex(t => t.id === transaction.id)
      );

      // Formatar dados
      const formattedData: TransactionWithDetails[] = uniqueTransactions.map((t: any) => ({ // Cast to new type
        ...t,
        category: t.category?.name || "Sem categoria",
        credit_card_bill: t.credit_card_bill, // Include nested credit_card_bill
      }));

      setSearchResults(formattedData);
    } catch (error) {
      console.error("Error in search:", error);
      setSearchResults([]);
    }

    setLoading(false);
    setLoadingSummary(false); // End summary loading
  }, [query, currentWorkspace]); // Add currentWorkspace to dependencies

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Filtrar resultados por mês
  useEffect(() => {
    if (selectedMonth === "all") {
      setFilteredResults(searchResults);
    } else {
      const [year, month] = selectedMonth.split("-");
      const filtered = searchResults.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const transactionYear = transactionDate.getFullYear().toString();
        const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
        
        return transactionYear === year && transactionMonth === month;
      });
      setFilteredResults(filtered);
    }
  }, [searchResults, selectedMonth]);

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
    } else if (transaction.credit_card_bill_id) { // Check for credit card transaction
      openEditCreditCardTransactionModal(transaction);
    } else {
      openEditTransactionModal(transaction);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => setSelectedTransaction(null), 300);
    fetchSearchResults();
  };

  const closeTransferModal = () => {
    setIsTransferModalOpen(false);
    setTimeout(() => setSelectedTransferData(null), 300);
    fetchSearchResults();
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

  if (!currentWorkspace) {
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
      {/* Removed direct usage of EditTransactionModal and TransferModal here */}
      {/* They are now managed by ModalContext in Layout.tsx */}
    </>
  );
};

export default SearchResultsPage;