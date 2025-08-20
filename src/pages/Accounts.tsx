import { useState, useEffect } from "react";
import { Plus, Edit, Eye, Star, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import EditAccountModal from "@/components/accounts/EditAccountModal";

interface Account {
  id: string;
  name: string;
  bank: string;
  bank_id: string | null; // Added bank_id
  type: string;
  balance: number;
  is_default: boolean;
  include_in_total: boolean;
}

interface DeleteValidation {
  canDelete: boolean;
  hasTransactions: boolean;
  transactionCount: number;
  isDefault: boolean;
  hasBalance: boolean;
  balance: number;
}

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteValidation, setDeleteValidation] = useState<DeleteValidation | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transferToAccountId, setTransferToAccountId] = useState<string>("");
  const { openAddAccountModal } = useModal();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (currentWorkspace) {
      fetchAccounts();
    }
  }, [currentWorkspace]);

  const fetchAccounts = async () => {
    if (!currentWorkspace) return;

    const { data, error } = await supabase
      .from("accounts")
      .select("*, bank_id") // Ensure bank_id is selected
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false });

    if (error) {
      showError("Erro ao carregar contas");
      console.error("Error fetching accounts:", error);
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  const validateAccountDeletion = async (account: Account): Promise<DeleteValidation> => {
    // Verificar se tem transações
    const { count: transactionCount, error: transactionError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("account_id", account.id);

    if (transactionError) {
      console.error("Error checking transactions:", transactionError);
      return {
        canDelete: false,
        hasTransactions: false,
        transactionCount: 0,
        isDefault: account.is_default,
        hasBalance: Math.abs(account.balance) > 0.01,
        balance: account.balance,
      };
    }

    const hasTransactions = (transactionCount || 0) > 0;
    const hasBalance = Math.abs(account.balance) > 0.01;
    const isDefault = account.is_default;

    return {
      canDelete: !isDefault && !hasTransactions && !hasBalance,
      hasTransactions,
      transactionCount: transactionCount || 0,
      isDefault,
      hasBalance,
      balance: account.balance,
    };
  };

  const handleDeleteClick = async (account: Account) => {
    const validation = await validateAccountDeletion(account);
    setDeleteValidation(validation);
    setAccountToDelete(account);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete || !deleteValidation) return;

    // Se tem saldo e foi selecionada uma conta para transferir
    if (deleteValidation.hasBalance && transferToAccountId) {
      // Criar transação de transferência
      const { error: transferError } = await supabase
        .from("transactions")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          workspace_id: currentWorkspace?.id,
          account_id: transferToAccountId,
          name: `Transferência da conta ${accountToDelete.name}`,
          amount: deleteValidation.balance,
          date: new Date().toISOString(),
          description: `Saldo transferido automaticamente ao excluir a conta ${accountToDelete.name}`,
          status: "Concluído",
        });

      if (transferError) {
        showError("Erro ao transferir saldo");
        return;
      }

      // Atualizar saldo da conta de destino
      const targetAccount = accounts.find(acc => acc.id === transferToAccountId);
      if (targetAccount) {
        const { error: updateError } = await supabase
          .from("accounts")
          .update({ balance: targetAccount.balance + deleteValidation.balance })
          .eq("id", transferToAccountId);

        if (updateError) {
          showError("Erro ao atualizar saldo da conta de destino");
          return;
        }
      }
    }

    // Excluir a conta
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", accountToDelete.id);

    if (error) {
      showError("Erro ao excluir conta");
    } else {
      showSuccess("Conta excluída com sucesso!");
      fetchAccounts();
    }

    setIsDeleteDialogOpen(false);
    setAccountToDelete(null);
    setDeleteValidation(null);
    setTransferToAccountId("");
  };

  const handleSetDefault = async (accountId: string) => {
    const { error } = await supabase.rpc("set_default_account", {
      account_id_to_set: accountId,
    });

    if (error) {
      showError("Erro ao definir conta padrão");
    } else {
      showSuccess("Conta padrão definida!");
      fetchAccounts();
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsEditModalOpen(true);
  };

  const handleAccountUpdated = () => {
    fetchAccounts();
    setIsEditModalOpen(false);
    setEditingAccount(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Conta Corrente":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Poupança":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Investimento":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Cartão de Crédito":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getAvailableAccountsForTransfer = () => {
    return accounts.filter(acc => acc.id !== accountToDelete?.id);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Contas</h1>
            <p className="text-muted-foreground">
              Gerencie suas contas bancárias e cartões de crédito.
            </p>
          </div>
          <Button onClick={() => openAddAccountModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
        <div className="text-center py-8">Carregando contas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas bancárias e cartões de crédito.
          </p>
        </div>
        <Button onClick={() => openAddAccountModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Nenhuma conta encontrada</h3>
              <p className="text-muted-foreground">
                Comece criando sua primeira conta bancária.
              </p>
              <Button onClick={() => openAddAccountModal()} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="grid gap-4 md:hidden">
            {accounts.map((account) => (
              <Card key={account.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        {account.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <CardDescription>{account.bank}</CardDescription>
                    </div>
                    <Badge className={getTypeColor(account.type)}>
                      {account.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo</p>
                      <p className={`text-xl font-bold ${
                        account.balance >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/accounts/${account.id}`)}
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAccount(account)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    {!account.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(account.id)}
                        className="flex-1"
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Definir Padrão
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(account)}
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Suas Contas</CardTitle>
              <CardDescription>
                Gerencie suas contas bancárias e cartões de crédito.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {account.name}
                          {account.is_default && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{account.bank}</TableCell> {/* Still using account.bank for display */}
                      <TableCell>
                        <Badge className={getTypeColor(account.type)}>
                          {account.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        account.balance >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {formatCurrency(account.balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/accounts/${account.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!account.is_default && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(account.id)}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(account)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Complex Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Excluir Conta
            </DialogTitle>
            <DialogDescription>
              Verificando condições para exclusão da conta "{accountToDelete?.name}"
            </DialogDescription>
          </DialogHeader>

          {deleteValidation && (
            <div className="space-y-4">
              {/* Validações */}
              <div className="space-y-3">
                {deleteValidation.isDefault && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700">
                      Esta é sua conta padrão. Defina outra conta como padrão antes de excluir.
                    </span>
                  </div>
                )}

                {deleteValidation.hasTransactions && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-700">
                      Esta conta possui {deleteValidation.transactionCount} transação(ões). 
                      Todas as transações serão excluídas permanentemente.
                    </span>
                  </div>
                )}

                {deleteValidation.hasBalance && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-blue-700">
                        Esta conta possui saldo de {formatCurrency(deleteValidation.balance)}. 
                        Escolha uma conta para transferir o saldo:
                      </span>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="transfer-account">Transferir saldo para:</Label>
                      <Select value={transferToAccountId} onValueChange={setTransferToAccountId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableAccountsForTransfer().map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} - {account.bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {deleteValidation.canDelete && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm text-green-700">
                      ✓ Esta conta pode ser excluída sem problemas.
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={
                    deleteValidation.isDefault || 
                    (deleteValidation.hasBalance && !transferToAccountId)
                  }
                >
                  {deleteValidation.hasTransactions ? "Excluir Conta e Transações" : "Excluir Conta"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Account Modal */}
      {editingAccount && (
        <EditAccountModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAccount(null);
          }}
          account={editingAccount}
          onAccountUpdated={handleAccountUpdated}
        />
      )}
    </div>
  );
};

export default Accounts;