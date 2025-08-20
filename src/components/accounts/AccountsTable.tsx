"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
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

interface AccountsTableProps {
  accounts: Account[];
  onAccountUpdated: () => void;
}

const AccountsTable = ({ accounts, onAccountUpdated }: AccountsTableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'Conta Corrente':
        return 'bg-blue-100 text-blue-800';
      case 'Poupança':
        return 'bg-green-100 text-green-800';
      case 'Cartão de Crédito':
        return 'bg-red-100 text-red-800';
      case 'Investimento':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      const { error } = await supabase.rpc('set_default_account', {
        account_id_to_set: accountId
      });

      if (error) throw error;

      showSuccess("Conta padrão definida com sucesso!");
      onAccountUpdated();
    } catch (error: any) {
      console.error("Error setting default account:", error);
      showError("Erro ao definir conta padrão. Tente novamente.");
    }
  };

  const handleDelete = async (accountId: string) => {
    setDeletingId(accountId);
    
    try {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      showSuccess("Conta excluída com sucesso!");
      onAccountUpdated();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      showError("Erro ao excluir conta. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhuma conta encontrada.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Crie sua primeira conta clicando no botão "Nova Conta".
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Banco</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {account.is_default && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                  {account.name}
                </div>
              </TableCell>
              <TableCell>{account.bank}</TableCell> {/* Still using account.bank for display */}
              <TableCell>
                <Badge className={getAccountTypeColor(account.type)}>
                  {account.type}
                </Badge>
              </TableCell>
              <TableCell className={account.balance >= 0 ? "text-green-600" : "text-red-600"}>
                {formatCurrency(account.balance)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {account.include_in_total ? (
                    <Badge variant="default">Incluído no total</Badge>
                  ) : (
                    <Badge variant="secondary">Não incluído</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {!account.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(account.id)}
                    >
                      Definir como padrão
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === account.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a conta "{account.name}"?
                          Esta ação não pode ser desfeita e todas as transações associadas serão perdidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(account.id)}
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
    </div>
  );
};

export default AccountsTable;