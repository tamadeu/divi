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
          category:categories (name)
        `)
        .eq("user_id", user.id)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,categories.name.ilike.%${query}%`); // Corrigido para categories.name

      if (error) {
        console.error("Error fetching search results:", error);
        setSearchResults([]);
      } else {
        const formattedData = data.map((t: any) => ({
          ...t,
          category: t.category?.name || "Sem categoria",
        }));
        setSearchResults(formattedData);
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