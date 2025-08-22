import { useState, useEffect, useMemo, useCallback } from "react";
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
import { TransactionWithDetails } from "@/types/transaction-details"; // Import new type
import { Skeleton } from "@/components/ui/skeleton";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import TransferModal from "@/components/transfers/TransferModal";
import { showError } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext"; // Import useModal
import EditCreditCardTransactionModal from "@/components/transactions/EditCreditCardTransactionModal"; // New import
import { useWorkspace } from "@/contexts/WorkspaceContext"; // Import useWorkspace
import { useSession } from "@/contexts/SessionContext"; // Import useSession
import { useNavigate } from "react-router-dom"; // Import useNavigate

const ITEMS_PER_PAGE = 5;

const AccountDetailPage = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [allFetchedTransactions, setAllFetchedTransactions] = useState<TransactionWithDetails[]>([]); // All transactions from RPC
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const { openAddTransferModal } = useModal(); // Removed edit modals
  const { currentWorkspace } = useWorkspace(); // Use useWorkspace hook
  const { session } = useSession(); // Use session
  const navigate = useNavigate(); // Initialize useNavigate

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAccountData = useCallback(async () => {
    if (!accountId || !currentWorkspace || !session?.user) {
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

    // Fetch account details
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

    // Fetch all transactions for the current user and workspace using RPC
    const { data: transactionsData, error: transactionsError } = await supabase.rpc('get_transaction_details', {
      p_user_id: session.user.id,
      p_workspace_id: currentWorkspace.id,
      p_status_filter: 'all', // Fetch all statuses, filter client-side if needed
      p_category_name_filter: 'all', // Fetch all categories, filter client-side if needed
      p_account_type_filter: 'all', // Fetch all account types, filter client-side if needed
    });

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      setAllFetchedTransactions([]);
    } else {
      setAllFetchedTransactions(transactionsData || []);
    }

    setLoading(false);
  }, [accountId, currentWorkspace, session?.user]); // Added currentWorkspace and session.user to dependencies

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(allFetchedTransactions.map((t) => t.category_name).filter(Boolean));
    return Array.from(categories).sort() as string[];
  }, [allFetchedTransactions]);

  const filteredTransactions = useMemo(() => {
    return allFetchedTransactions.filter((transaction) => {
      // Filter by accountId first (client-side)
      if (transaction.account_id !== accountId) {
        return false;
      }

      const searchMatch =
        searchQuery.toLowerCase() === "" ||
        transaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const statusMatch =
        statusFilter === "all" || transaction.status === statusFilter;
      const categoryMatch =
        categoryFilter === "all" || transaction.category_name === categoryFilter; // Use category_name

      return searchMatch && statusMatch && categoryMatch;
    });
  }, [allFetchedTransactions, accountId, searchQuery, statusFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handleRowClick = async (transaction: TransactionWithDetails) => {
    if (transaction.transfer_id) {
      // Fetch both transactions related to this transfer_id
      const { data: transferTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transfer_id', transaction.transfer_id)
        .eq('user_id', session?.user?.id);

      if (error) {
        showError("Erro ao carregar detalhes da transferência: " + error.message);
        return;
      }

      if (transferTransactions && transferTransactions.length === 2) {
        const fromTransaction = transferTransactions.find(t => t.amount < 0);
        const toTransaction = transferTransactions.find(t => t.amount > 0);

        if (fromTransaction && toTransaction) {
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
    } else {
      // Navigate to the dedicated transaction details page
      navigate(`/transactions/${transaction.id}`);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center gap-4 mb-4">
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
    </>
  );
};

export default AccountDetailPage;