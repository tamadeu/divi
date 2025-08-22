"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { showError, showSuccess } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSession } from "@/contexts/SessionContext";
import { Account, Category } from "@/types/database";
import { Loader2, UploadCloud, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const importSchema = z.object({
  csvFile: z.any().refine((file) => file instanceof File, "Um arquivo CSV é obrigatório."),
});

type ImportFormValues = z.infer<typeof importSchema>;

interface TransactionImportFormProps {
  onImportComplete: () => void;
}

export function TransactionImportForm({ onImportComplete }: TransactionImportFormProps) {
  const { currentWorkspace } = useWorkspace();
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
  });

  const fetchDependencies = useCallback(async () => {
    if (!currentWorkspace) return;

    const { data: accountsData, error: accountsError } = await supabase
      .from("accounts")
      .select("id, name, balance");
    if (accountsError) {
      console.error("Error fetching accounts:", accountsError);
      showError("Erro ao carregar contas.");
    } else {
      setAccounts(accountsData || []);
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, type");
    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
      showError("Erro ao carregar categorias.");
    } else {
      setCategories(categoriesData || []);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const handleImport = async (values: ImportFormValues) => {
    if (!currentWorkspace || !session?.user) {
      showError("Nenhum núcleo financeiro selecionado ou usuário não autenticado.");
      return;
    }

    setIsLoading(true);
    const file = values.csvFile;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const transactionsToInsert = [];
        const errors: string[] = [];
        const accountBalanceUpdates: { [key: string]: number } = {};

        for (const [index, row] of results.data.entries()) {
          const rowNumber = index + 2; // +1 for 0-indexed, +1 for header row
          const { date, name, amount, type, category, account, description } = row as any;

          if (!date || !name || !amount || !type || !category || !account) {
            errors.push(`Linha ${rowNumber}: Campos obrigatórios (date, name, amount, type, category, account) ausentes.`);
            continue;
          }

          const parsedAmount = parseFloat(amount.replace(',', '.'));
          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            errors.push(`Linha ${rowNumber}: Valor inválido para 'amount'.`);
            continue;
          }

          if (type !== 'income' && type !== 'expense') {
            errors.push(`Linha ${rowNumber}: Tipo de transação inválido. Use 'income' ou 'expense'.`);
            continue;
          }

          const transactionDate = new Date(date);
          if (isNaN(transactionDate.getTime())) {
            errors.push(`Linha ${rowNumber}: Formato de data inválido. Use YYYY-MM-DD.`);
            continue;
          }

          const foundCategory = categories.find(c => c.name.toLowerCase() === category.toLowerCase() && c.type === type);
          if (!foundCategory) {
            errors.push(`Linha ${rowNumber}: Categoria '${category}' não encontrada ou tipo incorreto para '${type}'.`);
            continue;
          }

          const foundAccount = accounts.find(a => a.name.toLowerCase() === account.toLowerCase());
          if (!foundAccount) {
            errors.push(`Linha ${rowNumber}: Conta '${account}' não encontrada.`);
            continue;
          }

          const finalAmount = type === 'expense' ? -parsedAmount : parsedAmount;

          transactionsToInsert.push({
            name,
            amount: finalAmount,
            date: transactionDate.toISOString(),
            account_id: foundAccount.id,
            category_id: foundCategory.id,
            status: 'Concluído', // Imported transactions are considered complete
            description: description || null,
            user_id: session.user.id,
            workspace_id: currentWorkspace.id,
            credit_card_bill_id: null, // Not for credit card transactions
            installment_number: null,
            total_installments: null,
          });

          // Prepare account balance updates
          if (accountBalanceUpdates[foundAccount.id]) {
            accountBalanceUpdates[foundAccount.id] += finalAmount;
          } else {
            accountBalanceUpdates[foundAccount.id] = foundAccount.balance + finalAmount;
          }
        }

        if (transactionsToInsert.length === 0) {
          showError("Nenhuma transação válida encontrada para importação.");
          setIsLoading(false);
          return;
        }

        try {
          const { error: insertError } = await supabase
            .from("transactions")
            .insert(transactionsToInsert);

          if (insertError) {
            throw insertError;
          }

          // Update account balances
          const accountUpdatePromises = Object.entries(accountBalanceUpdates).map(([accountId, newBalance]) =>
            supabase.from("accounts").update({ balance: newBalance }).eq("id", accountId)
          );
          await Promise.all(accountUpdatePromises);

          showSuccess(`Importação concluída! ${transactionsToInsert.length} transações adicionadas.`);
          if (errors.length > 0) {
            showError(`Algumas transações tiveram erros: ${errors.join('; ')}`);
          }
          form.reset();
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          onImportComplete(); // Trigger refresh in parent component
        } catch (error: any) {
          console.error("Error during import:", error);
          showError("Erro ao importar transações: " + error.message);
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        showError("Erro ao ler o arquivo CSV: " + error.message);
        setIsLoading(false);
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleImport)} className="space-y-4">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Formato do CSV</AlertTitle>
          <AlertDescription>
            Seu arquivo CSV deve conter as seguintes colunas (na primeira linha): <br />
            <code>date,name,amount,type,category,account,description</code> <br />
            Exemplo: <code>2023-01-15,Salário,3000.00,income,Salário,Conta Corrente,Pagamento mensal</code> <br />
            Use <code>income</code> ou <code>expense</code> para o tipo.
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="csvFile"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Arquivo CSV</FormLabel>
              <FormControl>
                <Input
                  {...fieldProps}
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(event) => {
                    onChange(event.target.files && event.target.files[0]);
                  }}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading || !form.formState.isValid}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Importar Transações
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}