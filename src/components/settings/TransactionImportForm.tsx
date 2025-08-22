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
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the structure for data to be passed to the confirmation page
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

const importSchema = z.object({
  csvFile: z.any().refine((file) => file instanceof File, "Um arquivo CSV é obrigatório."),
  selectedAccountId: z.string().uuid("Selecione uma conta válida para importação."),
});

type ImportFormValues = z.infer<typeof importSchema>;

interface TransactionImportFormProps {
  onImportComplete: () => void;
}

export function TransactionImportForm({ onImportComplete }: TransactionImportFormProps) {
  const { currentWorkspace } = useWorkspace();
  const { session } = useSession();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      selectedAccountId: "",
    },
  });

  const fetchDependencies = useCallback(async () => {
    if (!currentWorkspace) return;

    const { data: accountsData, error: accountsError } = await supabase
      .from("accounts")
      .select("id, name, balance")
      .eq("workspace_id", currentWorkspace.id)
      .order("name", { ascending: true });
    if (accountsError) {
      console.error("Error fetching accounts:", accountsError);
      showError("Erro ao carregar contas.");
    } else {
      setAccounts(accountsData || []);
      // Set default account if available and not already set
      if (!form.getValues("selectedAccountId") && accountsData && accountsData.length > 0) {
        const defaultAccount = accountsData.find(acc => acc.is_default) || accountsData[0];
        form.setValue("selectedAccountId", defaultAccount.id);
      }
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("workspace_id", currentWorkspace.id)
      .order("name", { ascending: true });
    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
      showError("Erro ao carregar categorias.");
    } else {
      setCategories(categoriesData || []);
    }
  }, [currentWorkspace, form]);

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
    const selectedAccountId = values.selectedAccountId;
    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

    if (!selectedAccount) {
      showError("A conta selecionada não foi encontrada.");
      setIsLoading(false);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const transactionsToInsert: ParsedTransaction[] = [];
        const errors: string[] = [];
        const accountBalanceUpdates: { [key: string]: number } = {
          [selectedAccountId]: selectedAccount.balance, // Initialize with current balance
        };
        const accountsMap: { [key: string]: Account } = {};
        const categoriesMap: { [key: string]: Category } = {};
        const uniqueMissingCategoriesSet = new Set<string>(); // To store "name|type"

        // Populate maps for quick lookup and passing to confirmation page
        accounts.forEach(acc => accountsMap[acc.id] = acc);
        categories.forEach(cat => categoriesMap[cat.id] = cat);

        for (const [index, row] of results.data.entries()) {
          const rowNumber = index + 2; // +1 for 0-indexed, +1 for header row
          const { date, name, amount, type, category, description } = row as any; // 'account' column is no longer expected

          if (!date || !name || !amount || !type || !category) {
            errors.push(`Linha ${rowNumber}: Campos obrigatórios (date, name, amount, type, category) ausentes.`);
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
          let categoryId: string | null = null;

          if (foundCategory) {
            categoryId = foundCategory.id;
          } else {
            // If category not found, add to missing set
            uniqueMissingCategoriesSet.add(`${category}|${type}`);
          }

          const finalAmount = type === 'expense' ? -parsedAmount : parsedAmount;

          transactionsToInsert.push({
            name,
            amount: finalAmount,
            date: transactionDate.toISOString(),
            account_id: selectedAccountId,
            category_id: categoryId, // Can be null
            status: 'Concluído', // Imported transactions are considered complete
            description: description || null,
            user_id: session.user.id,
            workspace_id: currentWorkspace.id,
            credit_card_bill_id: null,
            installment_number: null,
            total_installments: null,
            original_category_name: category, // Store original name for mapping
            original_category_type: type, // Store original type for mapping
          });

          // Update account balance for the single selected account
          accountBalanceUpdates[selectedAccountId] += finalAmount;
        }

        if (transactionsToInsert.length === 0 && errors.length === 0) {
          showError("Nenhuma transação válida encontrada para importação.");
          setIsLoading(false);
          return;
        }

        const uniqueMissingCategories: MissingCategory[] = Array.from(uniqueMissingCategoriesSet).map(item => {
          const [name, type] = item.split('|');
          return { name, type: type as 'income' | 'expense', mappedToId: null };
        });

        // Store parsed data in local storage and navigate
        const dataToStore: ParsedImportData = {
          transactions: transactionsToInsert,
          accountBalanceUpdates,
          errors,
          accountsMap,
          categoriesMap,
          selectedAccountId,
          selectedAccountName: selectedAccount.name,
          uniqueMissingCategories,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
        
        setIsLoading(false);
        form.reset({ selectedAccountId: selectedAccountId }); // Keep selected account
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
      <form onSubmit={form.handleSubmit(handleImport)} className="space-y-4 w-full">

        <FormField
          control={form.control}
          name="selectedAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Importar para Conta</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta para importação" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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