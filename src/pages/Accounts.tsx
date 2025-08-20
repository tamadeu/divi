import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, PlusCircle, Star, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useModal } from "@/contexts/ModalContext";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from "@/utils/toast";
import EditAccountModal from "@/components/accounts/EditAccountModal";
import DeleteAccountAlert from "@/components/accounts/DeleteAccountAlert";
import ConfirmDeleteAccountWithTransactionsModal from "@/components/accounts/ConfirmDeleteAccountWithTransactionsModal"; // New import

const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null); // For initial alert
  const [accountToDeleteWithTransactions, setAccountToDeleteWithTransactions] = useState<Account | null>(null); // For complex deletion modal
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

  const handleEditAccount = (account: Account, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingAccount(account);
  };

  const handleDeleteAccount = (account: Account) => {
    setDeletingAccount(account); // Open the initial confirmation alert
  };

  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;

    // Check if the account has any transactions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado para excluir uma conta.");
      setDeletingAccount(null);
      return;
    }

    const { count, error: countError } = await supabase
      .from("transactions")
      .select("id", { count: "exact" })
      .eq("account_id", deletingAccount.id)
      .eq("user_id", user.id);

    if (countError) {
      console.error("Error checking transactions:", countError);
      showError("Erro ao verificar transações da conta.");
      setDeletingAccount(null);
      return;
    }

    setDeletingAccount(null); // Close the initial alert

    if ((count || 0) > 0) {
      // If there are transactions, open the complex modal
      setAccountToDeleteWithTransactions(deletingAccount);
    } else {
      // If no transactions, proceed with direct deletion
      try {
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
      }
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Contas</h1>
        <Button 
          size="sm" 
          className="gap-1 w-full sm:w-auto" 
          onClick={() => openAddAccountModal(fetchAccounts)}
        >
          <PlusCircle className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="flex flex-col">
              <Link to={`/accounts/${account.id}`} className="flex-grow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                    <span className="truncate">{account.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {account.bank} - {account.type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xl sm:text-2xl font-bold">
                    {account.balance.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                </CardContent>
              </Link>
              <div className="p-4 pt-0 flex items-center justify-between">
                {account.is_default && (
                  <Badge className="flex items-center">
                    <Star className="mr-2 h-4 w-4" />
                    Padrão
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-2 ${account.is_default ? 'ml-auto' : 'w-full'}`}
                  onClick={(e) => handleEditAccount(account, e)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12">
          <div className="flex flex-col items-center gap-1 text-center px-4">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Nenhuma conta encontrada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece adicionando sua primeira conta.
            </p>
            <Button onClick={() => openAddAccountModal(fetchAccounts)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Conta
            </Button>
          </div>
        </div>
      )}

      <EditAccountModal
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onAccountUpdated={fetchAccounts}
        account={editingAccount}
        onDeleteRequest={handleDeleteAccount}
      />

      <DeleteAccountAlert
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        account={deletingAccount}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDeleteAccountWithTransactionsModal
        isOpen={!!accountToDeleteWithTransactions}
        onClose={() => setAccountToDeleteWithTransactions(null)}
        account={accountToDeleteWithTransactions}
        onAccountDeleted={fetchAccounts}
      />
    </>
  );
};

export default AccountsPage;