import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import NotFound from "./NotFound";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AccountTransactionsTable from "@/components/accounts/AccountTransactionsTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
import { Account, Transaction, Company } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import TransferModal from "@/components/transfers/TransferModal";
import { showError } from "@/utils/toast";

const ITEMS_PER_PAGE = 5;

const AccountDetailPage = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransferData, setSelectedTransferData] = useState<{ fromTransaction: Transaction, toTransaction: Transaction } | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAccountData = async () => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Fetch companies first
    const { data: companiesData, error: companiesError } = await supabase
      .from("companies")
      .select("name, logo_url");
    if (companiesError) {
      console.error("Error fetching companies:", companiesError);
    } else {
      setCompanies(companiesData || []);
    }

    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (accountError) {
      console.error("Error fetching account details:", accountError);
      setAccount(null);
    } else {
      setAccount(accountData);
    }

    const { data: transactionsData, error: transactionsError } = await supabase
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
        transfer_id
      `)
      .eq("account_id", accountId)
      .order("date", { ascending: false });

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
    } else {
      const formattedData = transactionsData.map((t: any) => ({
        ...t,
        category: t.category?.name || "Sem categoria",
      }));
      setTransactions(formattedData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAccountData();
  }, [accountId]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(transactions.map((t) => t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
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
  }, [transactions, searchQuery, statusFilter, categoryFilter]);

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
  };

  const closeTransferModal = () => {
    setIsTransferModalOpen(false);
    setTimeout(() => setSelectedTransferData(null), 300);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-56" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!account) {
    return <NotFound />;
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <Button asChild variant="outline" size="icon">
          <Link to="/accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold md:text-2xl">{account.name}</h1>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Conta</CardTitle>
            <CardDescription>{account.bank} - {account.type}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              Saldo:{" "}
              {account.balance.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Transações da Conta</CardTitle>
            <CardDescription>
              Uma lista de transações para esta conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Input
                placeholder="Pesquisar transações..."
                value={searchQuery}
                onChange={(e) => {
                  e.preventDefault();
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
            <AccountTransactionsTable
              transactions={paginatedTransactions}
              onRowClick={handleRowClick}
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
          </CardContent>
        </Card>
      </div>
      <EditTransactionModal
        transaction={selectedTransaction}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onTransactionUpdated={fetchAccountData}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={closeTransferModal}
        onTransferCompleted={fetchAccountData}
        initialTransferData={selectedTransferData}
      />
    </>
  );
};

export default AccountDetailPage;