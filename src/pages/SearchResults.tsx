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

  return (
    <>
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