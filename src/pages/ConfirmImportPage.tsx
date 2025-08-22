"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSession } from "@/contexts/SessionContext";
import { Account, Category } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ParsedTransaction {
  name: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category_id: string;
  account_id: string;
  description: string | null;
  user_id: string;
  workspace_id: string;
  credit_card_bill_id: null;
  installment_number: null;
  total_installments: null;
  // Temporary fields for display
  category_name?: string;
  account_name?: string;
}

interface ParsedImportData {
  transactions: ParsedTransaction[];
  accountBalanceUpdates: { [key: string]: number };
  errors: string[];
  accountsMap: { [key: string]: Account }; // Map to get account details for display
  categoriesMap: { [key: string]: Category }; // Map to get category details for display
}

const LOCAL_STORAGE_KEY = "pendingImportData";

const ConfirmImportPage = () => {
  const navigate = useNavigate();
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const { session } = useSession();
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      try {
        const data: ParsedImportData = JSON.parse(storedData);
        setParsedData(data);
      } catch (e) {
        console.error("Failed to parse stored import data:", e);
        showError("Erro ao carregar dados de importação. Tente novamente.");
        navigate("/settings");
      }
    } else {
      showError("Nenhum dado de importação encontrado. Por favor, importe um arquivo CSV.");
      navigate("/settings");
    }
    setIsLoading(false);
  }, [navigate]);

  const handleConfirmImport = async () => {
    if (!parsedData || !currentWorkspace || !session?.user) {
      showError("Dados de importação incompletos ou usuário não autenticado.");
      return;
    }

    setIsImporting(true);

    try {
      // Insert transactions
      const { error: insertError } = await supabase
        .from("transactions")
        .insert(parsedData.transactions.map(t => ({
          name: t.name,
          amount: t.amount,
          date: t.date,
          account_id: t.account_id,
          category_id: t.category_id,
          status: 'Concluído',
          description: t.description,
          user_id: session.user.id,
          workspace_id: currentWorkspace.id,
          credit_card_bill_id: null,
          installment_number: null,
          total_installments: null,
        })));

      if (insertError) {
        throw insertError;
      }

      // Update account balances
      const accountUpdatePromises = Object.entries(parsedData.accountBalanceUpdates).map(([accountId, newBalance]) =>
        supabase.from("accounts").update({ balance: newBalance }).eq("id", accountId)
      );
      await Promise.all(accountUpdatePromises);

      showSuccess(`Importação concluída! ${parsedData.transactions.length} transações adicionadas.`);
      if (parsedData.errors.length > 0) {
        showError(`Algumas transações tiveram erros durante o parsing: ${parsedData.errors.join('; ')}`);
      }
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      // Refresh workspaces to update account balances in context
      await refreshWorkspaces(); 
      navigate("/transactions");
    } catch (error: any) {
      console.error("Error during import confirmation:", error);
      showError("Erro ao importar transações: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    navigate("/settings");
  };

  if (isLoading || !parsedData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { transactions, errors, accountsMap, categoriesMap } = parsedData;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Confirmar Importação de Transações</h1>
          <p className="text-muted-foreground">
            Revise as transações que serão importadas.
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erros de Parsing Encontrados</AlertTitle>
          <AlertDescription>
            Algumas linhas do seu CSV não puderam ser processadas. Por favor, revise-as:
            <ul className="list-disc list-inside mt-2">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {transactions.length === 0 && errors.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Nenhuma transação válida para importar</AlertTitle>
          <AlertDescription>
            O arquivo CSV foi processado, mas nenhuma transação válida foi encontrada para importação.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Transações a Serem Importadas ({transactions.length})</CardTitle>
            <CardDescription>
              Verifique os detalhes de cada transação antes de confirmar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{transaction.name}</TableCell>
                      <TableCell
                        className={`font-semibold ${
                          transaction.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {transaction.amount.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type === 'income' ? 'Renda' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell>{categoriesMap[transaction.category_id]?.name || 'Desconhecida'}</TableCell>
                      <TableCell>{accountsMap[transaction.account_id]?.name || 'Desconhecida'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {transaction.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={handleCancel} disabled={isImporting}>
          Cancelar
        </Button>
        <Button onClick={handleConfirmImport} disabled={isImporting || transactions.length === 0}>
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmar Importação
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmImportPage;