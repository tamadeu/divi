import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { allTransactions, Transaction } from "@/data/mockData";
import AllTransactionsTable from "@/components/transactions/AllTransactionsTable";
import TransactionDetailsModal from "@/components/transactions/TransactionDetailsModal";

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!query) {
      return [];
    }
    const lowerCaseQuery = query.toLowerCase();
    return allTransactions.filter(
      (transaction) =>
        transaction.name.toLowerCase().includes(lowerCaseQuery) ||
        transaction.description.toLowerCase().includes(lowerCaseQuery) ||
        transaction.category.toLowerCase().includes(lowerCaseQuery)
    );
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
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Busca</CardTitle>
                <CardDescription>
                  {searchResults.length > 0
                    ? `Exibindo ${searchResults.length} resultado(s) para `
                    : `Nenhum resultado encontrado para `}
                  <span className="font-semibold">"{query}"</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AllTransactionsTable
                  transactions={searchResults}
                  onRowClick={handleRowClick}
                />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
};

export default SearchResultsPage;