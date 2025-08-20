import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, PlusCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useModal } from "@/contexts/ModalContext";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from "@/utils/toast";
import AccountsTable from "@/components/accounts/AccountsTable";
import EditAccountModal from "@/components/accounts/EditAccountModal";
import DeleteAccountAlert from "@/components/accounts/DeleteAccountAlert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const { openAddAccountModal } = useModal();

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching accounts:", error);
      } else {
        setAccounts(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSetDefault = async (accountId: string) => {
    setSettingDefaultId(accountId);
    const { error } = await supabase.rpc('set_default_account', {
      account_id_to_set: accountId
    });

    if (error) {
      showError("Erro ao definir conta padrão: " + error.message);
    } else {
      showSuccess("Conta padrão atualizada com sucesso!");
      fetchAccounts();
    }
    setSettingDefaultId(null);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
  };

  const handleDeleteAccount = (account: Account) => {
    setDeletingAccount(account);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;

    try {
      // First delete all transactions associated with this account
      const { error: transactionsError } = await supabase
        .from("transactions")
        .delete()
        .eq("account_id", deletingAccount.id);

      if (transactionsError) {
        throw transactionsError;
      }

      // Then delete the account
      const { error: accountError } = await supabase
        .from("accounts")
        .delete()
        .eq("id", deletingAccount.id);

      if (accountError) {
        throw accountError;
      }

      showSuccess("Conta excluída com sucesso!");
      fetchAccounts();
    } catch (error: any) {
      showError("Erro ao excluir conta: " + error.message);
    } finally {
      setDeletingAccount(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Contas</h1>
        <Button size="sm" className="gap-1" onClick={() => openAddAccountModal(fetchAccounts)}>
          <PlusCircle className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cards">Visualização em Cards</TabsTrigger>
          <TabsTrigger value="table">Visualização em Tabela</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cards">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : accounts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <Card key={account.id} className="flex flex-col">
                  <Link to={`/accounts/${account.id}`} className="flex-grow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="truncate">{account.name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </CardTitle>
                      <CardDescription>{account.bank} - {account.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {account.balance.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                    </CardContent>
                  </Link>
                  <div className="p-4 pt-0">
                    {account.is_default ? (
                      <Badge>
                        <Star className="mr-2 h-4 w-4" />
                        Padrão
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(account.id)}
                        disabled={settingDefaultId === account.id}
                      >
                        {settingDefaultId === account.id ? "Definindo..." : "Tornar Padrão"}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  Nenhuma conta encontrada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Comece adicionando sua primeira conta.
                </p>
                <Button className="mt-4" onClick={() => openAddAccountModal(fetchAccounts)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Conta
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Contas</CardTitle>
              <CardDescription>
                Gerencie todas as suas contas financeiras em uma tabela.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <AccountsTable
                  accounts={accounts}
                  onEdit={handleEditAccount}
                  onDelete={handleDeleteAccount}
                  onSetDefault={handleSetDefault}
                  settingDefaultId={settingDefaultId}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditAccountModal
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onAccountUpdated={fetchAccounts}
        account={editingAccount}
      />

      <DeleteAccountAlert
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        account={deletingAccount}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default AccountsPage;