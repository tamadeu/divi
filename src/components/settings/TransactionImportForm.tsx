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
import { useNavigate } from "react-router-dom"; // Import useNavigate

const importSchema = z.object({
  csvFile: z.any().refine((file) => file instanceof File, "Um arquivo CSV é obrigatório."),
});

type ImportFormValues = z.infer<typeof importSchema>;

interface TransactionImportFormProps {
  onImportComplete: () => void;
}

// Define the structure for data to be passed to the confirmation page
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

export function TransactionImportForm({ onImportComplete }: TransactionImportFormProps) {
  const { currentWorkspace } = useWorkspace();
  const { session } = useSession();
  const navigate = useNavigate(); // Initialize useNavigate
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
        const transactionsToInsert: ParsedTransaction[] = [];
        const errors: string[] = [];
        const accountBalanceUpdates: { [key: string]: number } = {};
        const accountsMap: { [key: string]: Account } = {};
        const categoriesMap: { [key: string]: Category } = {};

        // Populate maps for quick lookup and passing to confirmation page
        accounts.forEach(acc => accountsMap[acc.id] = acc);
        categories.forEach(cat => categoriesMap[cat.id] = cat);

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
            category_name: foundCategory.name, // For display on confirmation page
            account_name: foundAccount.name, // For display on confirmation page
          });

          // Prepare account balance updates
          if (accountBalanceUpdates[foundAccount.id]) {
            accountBalanceUpdates[foundAccount.id] += finalAmount;
          } else {
            // Initialize with current balance + first transaction amount
            accountBalanceUpdates[foundAccount.id] = foundAccount.balance + finalAmount;
          }
        }

        if (transactionsToInsert.length === 0 && errors.length === 0) {
          showError("Nenhuma transação válida encontrada para importação.");
          setIsLoading(false);
          return;
        }

        // Store parsed data in local storage and navigate
        const dataToStore: ParsedImportData = {
          transactions: transactionsToInsert,
          accountBalanceUpdates,
          errors,
          accountsMap,
          categoriesMap,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
        
        setIsLoading(false);
        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        navigate("/confirm-import"); // Navigate to the new confirmation page
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
              Processando...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Processar CSV
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}