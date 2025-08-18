import { useState, useMemo, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
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

const ITEMS_PER_PAGE = 10;

const TransactionsPage = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchTransactions = async () => {
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
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
      } else {
        const formattedData = data.map((t: any) => ({
          ...t,
          category: t.category?.name || "Sem categoria",
        }));
        setAllTransactions(formattedData);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(allTransactions.map((t) => t.category));
    return Array.from(categories).sort();
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

      return searchMatch && statusMatch && categoryMatch;
    });
  }, [allTransactions, searchQuery, statusFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTransaction(null), 300);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <Input
                        placeholder="Pesquisar por nome ou descrição..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="flex-grow"
                      />
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setStatusFilter(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
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
                        <SelectTrigger className="w-full sm:w-[180px]">
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
                    </div>
                    <AllTransactionsTable
                      transactions={paginatedTransactions}
                      onRowClick={handleRowClick}
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

export default TransactionsPage;