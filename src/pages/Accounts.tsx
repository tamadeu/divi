import { useState, useEffect } from "react";
import { Plus, Edit, Eye, Star, Trash2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface Account {
  id: string;
  name: string;
  bank: string;
  type: string;
  balance: number;
  is_default: boolean;
  include_in_total: boolean;
}

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
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
      .select("*")
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

  const handleDeleteAccount = async (accountId: string) => {
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", accountId);

    if (error) {
      showError("Erro ao excluir conta");
    } else {
      showSuccess("Conta excluída com sucesso!");
      fetchAccounts();
    }
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
          {/* Mobile Cards - visible only on mobile */}
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
                      onClick={() => navigate(`/accounts/${account.id}/edit`)}
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a conta "{account.name}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAccount(account.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table - hidden on mobile */}
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
                      <TableCell>{account.bank}</TableCell>
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
                            onClick={() => navigate(`/accounts/${account.id}/edit`)}
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a conta "{account.name}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAccount(account.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
};

export default Accounts;