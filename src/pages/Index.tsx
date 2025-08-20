import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { showError } from "@/utils/toast";
import { Transaction, Account, Category, Company } from "@/types/database";
import TransactionCardList from "@/components/transactions/TransactionCardList";
import AllTransactionsTable from "@/components/transactions/AllTransactionsTable";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import TransactionDetailsModal from "@/components/transactions/TransactionDetailsModal";
import VoiceTransactionButton from "@/components/transactions/VoiceTransactionButton";
import { useModal } from "@/contexts/ModalContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardSummary {
  total_balance: number;
  monthly_income: number;
  monthly_expenses: number;
}

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary>({
    total_balance: 0,
    monthly_income: 0,
    monthly_expenses: 0,
  });

  const {
    isAddTransactionModalOpen,
    openAddTransactionModal,
    closeAddTransactionModal,
    addTransactionInitialData,
    isEditTransactionModalOpen,
    openEditTransactionModal,
    closeEditTransactionModal,
    editTransactionData,
    isTransactionDetailsModalOpen,
    openTransactionDetailsModal,
    closeTransactionDetailsModal,
    transactionDetailsData,
  } = useModal();

  const isMobile = useIsMobile();

  const fetchDashboardSummary = async () => {
    const { data, error } = await supabase.rpc('get_dashboard_summary');
    
    if (error) {
      console.error('Error fetching dashboard summary:', error);
      return;
    }

    if (data && data.length > 0) {
      setDashboardSummary(data[0]);
    }
  };

  const fetchRecentTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        account:accounts(name, type),
        categories(name)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(5);

    if (error) {
      showError("Erro ao carregar transações: " + error.message);
      return;
    }

    const formattedTransactions = data?.map(transaction => ({
      ...transaction,
      category: transaction.categories?.name || "Sem categoria"
    })) || [];

    setTransactions(formattedTransactions);
  };

  const fetchAllTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        account:accounts(name, type),
        categories(name)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      showError("Erro ao carregar todas as transações: " + error.message);
      return;
    }

    const formattedTransactions = data?.map(transaction => ({
      ...transaction,
      category: transaction.categories?.name || "Sem categoria"
    })) || [];

    setAllTransactions(formattedTransactions);
  };

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      showError("Erro ao carregar contas: " + error.message);
      return;
    }

    setAccounts(data || []);
  };

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      showError("Erro ao carregar categorias: " + error.message);
      return;
    }

    setCategories(data || []);
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*");

    if (error) {
      console.error("Erro ao carregar empresas:", error);
      return;
    }

    setCompanies(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardSummary(),
      fetchRecentTransactions(),
      fetchAllTransactions(),
      fetchAccounts(),
      fetchCategories(),
      fetchCompanies(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransactionAdded = () => {
    fetchData();
  };

  const handleTransactionUpdated = () => {
    fetchData();
  };

  const handleTransactionDeleted = () => {
    fetchData();
  };

  const handleRowClick = (transaction: Transaction) => {
    openTransactionDetailsModal(transaction);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    openEditTransactionModal(transaction);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas finanças
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <VoiceTransactionButton />
          <Button onClick={() => openAddTransactionModal()} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardSummary.total_balance.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardSummary.monthly_income.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {Math.abs(dashboardSummary.monthly_expenses).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Transações Recentes</TabsTrigger>
          <TabsTrigger value="all">Todas as Transações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                Suas últimas 5 transações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionCardList
                transactions={transactions}
                loading={loading}
                onRowClick={handleRowClick}
                companies={companies}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>
                Histórico completo de transações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AllTransactionsTable
                transactions={allTransactions}
                onRowClick={handleRowClick}
                companies={companies}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={closeAddTransactionModal}
        onTransactionAdded={handleTransactionAdded}
        initialData={addTransactionInitialData}
      />

      <EditTransactionModal
        isOpen={isEditTransactionModalOpen}
        onClose={closeEditTransactionModal}
        onTransactionUpdated={handleTransactionUpdated}
        transaction={editTransactionData}
      />

      <TransactionDetailsModal
        transaction={transactionDetailsData}
        isOpen={isTransactionDetailsModalOpen}
        onClose={closeTransactionDetailsModal}
        onEdit={handleEditTransaction}
        onTransactionDeleted={handleTransactionDeleted}
      />
    </div>
  );
};

export default Index;