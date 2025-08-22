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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParsedTransaction {
  name: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category_id: string | null; // Can be null if category not found
  account_id: string; // Now pre-selected
  description: string | null;
  user_id: string;
  workspace_id: string;
  credit_card_bill_id: null;
  installment_number: null;
  total_installments: null;
  // Temporary fields for display and mapping
  original_category_name: string; // The name from CSV
  original_category_type: 'income' | 'expense'; // The type from CSV
}

interface MissingCategory {
  name: string;
  type: 'income' | 'expense';
  mappedToId: string | null; // User selected category ID
}

interface ParsedImportData {
  transactions: ParsedTransaction[];
  accountBalanceUpdates: { [key: string]: number };
  errors: string[]; // Errors from parsing, not from missing categories/accounts
  accountsMap: { [key: string]: Account };
  categoriesMap: { [key: string]: Category };
  selectedAccountId: string;
  selectedAccountName: string;
  uniqueMissingCategories: MissingCategory[];
}

const LOCAL_STORAGE_KEY = "pendingImportData";

const ConfirmImportPage = () => {
  const navigate = useNavigate();
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const { session } = useSession();
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        try {
          const data: ParsedImportData = JSON.parse(storedData);
          setParsedData(data);

          // Fetch all categories for mapping dropdowns
          if (currentWorkspace) {
            const { data: categoriesData, error: categoriesError } = await supabase
              .from("categories")
              .select("id, name, type")
              .eq("workspace_id", currentWorkspace.id)
              .order("name", { ascending: true });
            
            if (categoriesError) {
              console.error("Error fetching categories for mapping:", categoriesError);
              showError("Erro ao carregar categorias para mapeamento.");
            } else {
              setAvailableCategories(categoriesData || []);
            }
          }
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
    };

    loadData();
  }, [navigate, currentWorkspace]);

  const handleCategoryMappingChange = (missingCategoryName: string, missingCategoryType: 'income' | 'expense', newCategoryId: string) => {
    if (parsedData) {
      setParsedData(prevData => {
        if (!prevData) return null;

        const updatedMissingCategories = prevData.uniqueMissingCategories.map(mc =>
          mc.name === missingCategoryName && mc.type === missingCategoryType
            ? { ...mc, mappedToId: newCategoryId }
            : mc
        );

        return {
          ...prevData,
          uniqueMissingCategories: updatedMissingCategories,
        };
      });
    }
  };

  const allCategoriesMapped = parsedData?.uniqueMissingCategories.every(mc => mc.mappedToId !== null) ?? true;

  const handleConfirmImport = async () => {
    if (!parsedData || !currentWorkspace || !session?.user || !allCategoriesMapped) {
      showError("Dados de importação incompletos ou categorias não mapeadas.");
      return;
    }

    setIsImporting(true);

    try {
      // Prepare transactions with mapped category IDs
      const transactionsToInsert = parsedData.transactions.map(t => {
        let finalCategoryId = t.category_id;
        if (finalCategoryId === null) {
          // Find the mapped ID for this original category
          const mappedCategory = parsedData.uniqueMissingCategories.find(
            mc => mc.name === t.original_category_name && mc.type === t.original_category_type
          );
          if (mappedCategory?.mappedToId) {
            finalCategoryId = mappedCategory.mappedToId;
          } else {
            // This should not happen if allCategoriesMapped is true, but as a fallback
            console.warn(`Category mapping not found for ${t.original_category_name}`);
            return null; // Or throw an error
          }
        }

        return {
          name: t.name,
          amount: t.amount,
          date: t.date,
          account_id: t.account_id,
          category_id: finalCategoryId,
          status: 'Concluído',
          description: t.description,
          user_id: session.user.id,
          workspace_id: currentWorkspace.id,
          credit_card_bill_id: null,
          installment_number: null,
          total_installments: null,
        };
      }).filter(Boolean); // Remove any null transactions if mapping failed

      if (transactionsToInsert.length === 0) {
        showError("Nenhuma transação válida para importar após o mapeamento de categorias.");
        setIsImporting(false);
        return;
      }

      // Insert transactions
      const { error: insertError } = await supabase
        .from("transactions")
        .insert(transactionsToInsert);

      if (insertError) {
        throw insertError;
      }

      // Update account balances
      const accountUpdatePromises = Object.entries(parsedData.accountBalanceUpdates).map(([accountId, newBalance]) =>
        supabase.from("accounts").update({ balance: newBalance }).eq("id", accountId)
      );
      await Promise.all(accountUpdatePromises);

      showSuccess(`Importação concluída! ${transactionsToInsert.length} transações adicionadas.`);
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

  const { transactions, errors, accountsMap, categoriesMap, selectedAccountName, uniqueMissingCategories } = parsedData;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Confirmar Importação de Transações</h1>
          <p className="text-muted-foreground">
            Revise as transações que serão importadas para a conta: <span className="font-semibold text-primary">{selectedAccountName}</span>
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

      {uniqueMissingCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Categorias Não Encontradas
            </CardTitle>
            <CardDescription>
              As seguintes categorias do seu CSV não foram encontradas no seu núcleo financeiro. Por favor, mapeie-as para categorias existentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria do CSV</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mapear para</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueMissingCategories.map((mc, index) => (
                    <TableRow key={`${mc.name}-${mc.type}-${index}`}>
                      <TableCell className="font-medium">{mc.name}</TableCell>
                      <TableCell>
                        <Badge variant={mc.type === 'income' ? 'default' : 'destructive'}>
                          {mc.type === 'income' ? 'Renda' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mc.mappedToId || ""}
                          onValueChange={(value) => handleCategoryMappingChange(mc.name, mc.type, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories
                              .filter(cat => cat.type === mc.type)
                              .map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => {
                    const isCategoryMissing = transaction.category_id === null;
                    const mappedCategory = isCategoryMissing
                      ? uniqueMissingCategories.find(mc => mc.name === transaction.original_category_name && mc.type === transaction.original_category_type)
                      : null;
                    const displayCategoryName = isCategoryMissing
                      ? (mappedCategory?.mappedToId ? availableCategories.find(c => c.id === mappedCategory.mappedToId)?.name : transaction.original_category_name)
                      : (categoriesMap[transaction.category_id!]?.name || 'Desconhecida');

                    return (
                      <TableRow key={index} className={isCategoryMissing && !mappedCategory?.mappedToId ? "bg-amber-50/20" : ""}>
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
                        <TableCell>
                          {isCategoryMissing && !mappedCategory?.mappedToId ? (
                            <span className="text-amber-500 font-medium">
                              {displayCategoryName} (Mapear!)
                            </span>
                          ) : (
                            displayCategoryName
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {transaction.description || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        <Button onClick={handleConfirmImport} disabled={isImporting || transactions.length === 0 || !allCategoriesMapped}>
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