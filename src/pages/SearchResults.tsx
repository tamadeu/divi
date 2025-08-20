import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Transaction } from "@/types/database";
import AllTransactionsTable from "@/components/transactions/AllTransactionsTable";
import TransactionDetailsModal from "@/components/transactions/TransactionDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTransaction(null), 300);
  };

  // Calcular totais
  const totalIncome = searchResults
    .filter(t => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = searchResults
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
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(totalIncome)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                `${searchResults.filter(t => Number(t.amount) > 0).length} transação(ões)`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(totalExpenses)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                `${searchResults.filter(t => Number(t.amount) < 0).length} transação(ões)`
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
              : searchResults.length > 0
              ? `Exibindo ${searchResults.length} resultado(s) para `
              : `Nenhum resultado encontrado para `}
            <span className="font-semibold">"{query}"</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <AllTransactionsTable
              transactions={searchResults}
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