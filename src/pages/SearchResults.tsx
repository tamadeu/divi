import { useState, useEffect } from "react";
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
import { Transaction } from "@/types/database";
import AllTransactionsTable from "@/components/transactions/AllTransactionsTable";
import TransactionDetailsModal from "@/components/transactions/TransactionDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  const [filteredResults, setFilteredResults] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

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

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setSearchResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      try {
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
            category:categories (name)
          `)
          .eq("user_id", user.id)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

        if (transactionError) {
          console.error("Error fetching transactions:", transactionError);
        }

        // Busca 2: Categorias que correspondem à busca
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("id")
          .eq("user_id", user.id)
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
              category:categories (name)
            `)
            .eq("user_id", user.id)
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
        const formattedData = uniqueTransactions.map((t: any) => ({
          ...t,
          category: t.category?.name || "Sem categoria",
        }));

        setSearchResults(formattedData);
      } catch (error) {
        console.error("Error in search:", error);
        setSearchResults([]);
      }

      setLoading(false);
    };

    fetchSearchResults();
  }, [query]);

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

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTransaction(null), 300);
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total de Receitas</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {loading ? (
                <Skeleton className="h-6 md:h-8 w-20 md:w-24" />
              ) : (
                formatCurrency(totalIncome)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-3 md:h-4 w-12 md:w-16" />
              ) : (
                `${filteredResults.filter(t => Number(t.amount) > 0).length} transação(ões)`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total de Despesas</CardTitle>
            <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-red-600">
              {loading ? (
                <Skeleton className="h-6 md:h-8 w-20 md:w-24" />
              ) : (
                formatCurrency(totalExpenses)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-3 md:h-4 w-12 md:w-16" />
              ) : (
                `${filteredResults.filter(t => Number(t.amount) < 0).length} transação(ões)`
              )}
            </p>
          </CardContent>
        </Card>
      </div>

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
            />
          )}
        </CardContent>
      </Card>
      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
};

export default SearchResultsPage;