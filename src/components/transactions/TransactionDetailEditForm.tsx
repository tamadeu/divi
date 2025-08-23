"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { Account, Category } from "@/types/database";
import { CalendarIcon, PlusCircle, Calculator as CalculatorIcon, Trash2 } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AddAccountModal from "../accounts/AddAccountModal";
import AddCategoryModal from "../categories/AddCategoryModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calculator } from "@/components/ui/calculator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { TransactionWithDetails } from "@/types/transaction-details"; // Import the new type

const transactionSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  type: z.enum(["income", "expense"], { required_error: "O tipo é obrigatório." }),
  amount: z.coerce.number().positive("O valor deve ser um número positivo."),
  date: z.date({ required_error: "A data é obrigatória." }),
  account_id: z.string({ required_error: "Selecione uma conta."}).uuid("Selecione uma conta válida."),
  category_id: z.string({ required_error: "Selecione uma categoria."}).uuid("Selecione uma categoria válida."),
  status: z.enum(["Concluído", "Pendente"]),
  description: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionDetailEditFormProps {
  transaction: TransactionWithDetails; // Use TransactionWithDetails
  onClose: () => void; // Function to navigate back
  onTransactionUpdated: () => void;
  onTransactionDeleted: () => void;
}

const TransactionDetailEditForm = ({ transaction, onClose, onTransactionUpdated, onTransactionDeleted }: TransactionDetailEditFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [isNamePopoverOpen, setIsNamePopoverOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFutureDate, setIsFutureDate] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      name: "",
      amount: 0,
      date: new Date(),
      status: "Concluído",
      description: "",
      type: "expense",
      account_id: "", 
      category_id: "", 
    },
  });

  const transactionType = form.watch("type");
  const nameValue = form.watch("name");
  const transactionDate = form.watch("date");
  const amountValue = form.watch("amount");

  useEffect(() => {
    if (transactionDate) {
      const today = startOfDay(new Date());
      const selectedDate = startOfDay(transactionDate);

      if (selectedDate > today) {
        setIsFutureDate(true);
        form.setValue("status", "Pendente", { shouldValidate: true });
      } else {
        setIsFutureDate(false);
        if (form.getValues("status") === "Pendente" && transaction?.status !== "Pendente") {
          form.setValue("status", "Concluído", { shouldValidate: true });
        }
      }
    }
  }, [transactionDate, form, transaction]);

  const filteredCategories = useMemo(() => {
    if (!transactionType) return [];
    const filtered = categories.filter(c => c.type === (transactionType === 'income' ? 'Receita' : 'Despesa') || c.type === transactionType);

    // Group by parent and sort
    const categoriesMap = new Map<string, Category>();
    filtered.forEach(cat => categoriesMap.set(cat.id, cat));

    const topLevelCategories = filtered.filter(cat => !cat.parent_category_id);
    const subCategories = filtered.filter(cat => cat.parent_category_id);

    const sortedCategories: Category[] = [];

    topLevelCategories.sort((a, b) => a.name.localeCompare(b.name)).forEach(parent => {
      sortedCategories.push(parent);
      subCategories
        .filter(sub => sub.parent_category_id === parent.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(sub => sortedCategories.push({ ...sub, name: `- ${sub.name}` })); // Add hyphen for subcategories
    });

    return sortedCategories;
  }, [categories, transactionType]);

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    // Buscar contas do workspace atual
    const { data: accountsData } = await supabase
      .from("accounts")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("name", { ascending: true });
    setAccounts(accountsData || []);

    // Buscar categorias do workspace atual
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("name", { ascending: true });
    setCategories(categoriesData || []);
  }, [currentWorkspace]);

  useEffect(() => {
    if (transaction && currentWorkspace) {
      fetchData().then(() => {
        const transactionType = transaction.amount > 0 ? "income" : "expense";
        const absoluteAmount = Math.abs(transaction.amount);
        
        form.reset({
          name: transaction.name,
          type: transactionType,
          amount: absoluteAmount,
          date: new Date(transaction.date),
          account_id: transaction.account_id || "",
          category_id: transaction.category_id || "",
          status: transaction.status,
          description: transaction.description || "",
        });

        // Explicitly set category_id again after a short delay
        // This can help if there's a race condition with Select options loading
        if (transaction.category_id) {
          setTimeout(() => {
            form.setValue('category_id', transaction.category_id!, { shouldValidate: true });
          }, 50); // Small delay
        }
      });
    }
  }, [transaction, form, fetchData, currentWorkspace]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!transactionType || !currentWorkspace) return;

      // Buscar sugestões de nomes de transações do workspace atual
      const { data, error } = await supabase
        .from('transactions')
        .select('name, amount')
        .eq('workspace_id', currentWorkspace.id)
        .limit(500);

      if (error) {
        console.error("Error fetching transaction names:", error);
        return;
      }

      const filteredNames = data
        .filter(t => (transactionType === 'expense' ? t.amount < 0 : t.amount > 0))
        .map(t => t.name)
        .filter(name => !name.toLowerCase().startsWith('transferência'));

      const uniqueNames = [...new Set(filteredNames)];
      setNameSuggestions(uniqueNames);
    };

    fetchSuggestions();
  }, [transactionType, currentWorkspace]);

  const filteredNameSuggestions = useMemo(() => {
    if (!nameValue) return [];
    return nameSuggestions.filter(s =>
      s.toLowerCase().includes(nameValue.toLowerCase()) && s.toLowerCase() !== nameValue.toLowerCase()
    );
  }, [nameValue, nameSuggestions]);

  const handleSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado.");
      setIsSubmitting(false);
      return;
    }

    const newAmount = values.type === 'expense' ? -Math.abs(values.amount) : Math.abs(values.amount);
    const oldAmount = transaction.amount;
    const oldStatus = transaction.status;
    const oldAccountId = transaction.account_id;

    // Atualizar a transação
    const { error: transactionError } = await supabase
      .from("transactions")
      .update({
        name: values.name,
        amount: newAmount,
        date: values.date.toISOString(),
        account_id: values.account_id,
        category_id: values.category_id,
        status: values.status,
        description: values.description,
      })
      .eq("id", transaction.id);

    if (transactionError) {
      showError("Erro ao atualizar transação: " + transactionError.message);
      setIsSubmitting(false);
      return;
    }

    // Lógica de ajuste de saldo
    if (oldStatus === 'Concluído' && oldAccountId) {
      // Reverter o impacto da transação antiga na conta antiga
      const { data: oldAccountData, error: oldAccountError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", oldAccountId)
        .single();

      if (oldAccountData && !oldAccountError) {
        const revertedBalance = oldAccountData.balance - oldAmount;
        await supabase
          .from("accounts")
          .update({ balance: revertedBalance })
          .eq("id", oldAccountId);
      } else if (oldAccountError) {
        console.error("Error fetching old account balance:", oldAccountError);
      }
    }

    if (values.status === 'Concluído' && values.account_id) {
      // Aplicar o impacto da nova transação na nova conta
      const { data: newAccountData, error: newAccountError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", values.account_id)
        .single();

      if (newAccountData && !newAccountError) {
        const updatedBalance = newAccountData.balance + newAmount;
        await supabase
          .from("accounts")
          .update({ balance: updatedBalance })
          .eq("id", values.account_id);
      } else if (newAccountError) {
        console.error("Error fetching new account balance:", newAccountError);
      }
    }

    setIsSubmitting(false); // Reset loading state
    onTransactionUpdated(); // Call the success callback
  };

  const handleCalculatorValue = (value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      form.setValue("amount", numericValue, { shouldValidate: true });
    }
    setShowCalculator(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError("Você precisa estar logado.");
        setIsDeleting(false); // Reset loading state
        return;
      }

      // Se a transação estava concluída, precisamos reverter o saldo da conta
      if (transaction.status === 'Concluído' && transaction.account_id) {
        const { data: accountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", transaction.account_id)
          .single();

        if (accountData) {
          const newBalance = accountData.balance - transaction.amount;
          await supabase
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", transaction.account_id);
        }
      }

      // Deletar a transação
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transaction.id);

      if (error) {
        showError("Erro ao excluir transação: " + error.message);
        setIsDeleting(false); // Reset loading state
        return;
      }

      setIsDeleting(false); // Reset loading state
      setShowDeleteDialog(false); // Close dialog
      onTransactionDeleted(); // Call the success callback
    } catch (error) {
      showError("Erro inesperado ao excluir transação.");
      setIsDeleting(false); // Reset loading state
    }
  };

  if (!currentWorkspace) return null;

  return (
    <>
      <div className="p-4 bg-card rounded-lg shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          value="expense"
                          className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
                        >
                          Despesa
                        </TabsTrigger>
                        <TabsTrigger
                          value="income"
                          className="data-[state=active]:bg-green-600 data-[state=active]:text-primary-foreground"
                        >
                          Renda
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <Popover open={isNamePopoverOpen && filteredNameSuggestions.length > 0} onOpenChange={setIsNamePopoverOpen}>
                    <PopoverAnchor asChild>
                      <FormControl>
                        <Input
                          placeholder={transactionType === 'expense' ? "Ex: Uber" : "Ex: Salário"}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (e.target.value) {
                              setIsNamePopoverOpen(true);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setIsNamePopoverOpen(false), 150);
                            field.onBlur();
                          }}
                          onFocus={() => setIsNamePopoverOpen(true)}
                          autoComplete="off"
                        />
                      </FormControl>
                    </PopoverAnchor>
                    <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {filteredNameSuggestions.map((suggestion) => (
                              <CommandItem
                                key={suggestion}
                                value={suggestion}
                                onSelect={() => {
                                  form.setValue("name", suggestion, { shouldValidate: true });
                                  setIsNamePopoverOpen(false);
                                }}
                              >
                                {suggestion}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    {isMobile ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={amountValue > 0 ? amountValue.toString() : ""}
                          placeholder="0.00"
                          readOnly
                          className="cursor-pointer"
                          onClick={() => setShowCalculator(true)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowCalculator(true)}
                        >
                          <CalculatorIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsAddAccountModalOpen(true)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsAddCategoryModalOpen(true)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="Concluído" disabled={isFutureDate}>
                          Concluído
                        </TabsTrigger>
                        <TabsTrigger
                          value="Pendente"
                          className="data-[state=active]:bg-warning data-[state=active]:text-warning-foreground"
                        >
                          Pendente
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  {isFutureDate && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Transações futuras são definidas como pendentes.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Adicione uma nota..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className={cn(
              "flex flex-col gap-2",
              !isMobile && "flex-row justify-between"
            )}>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSubmitting || isDeleting}
                className={cn(isMobile && "w-full order-3", !isMobile && "mr-auto")}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
              <div className={cn(isMobile && "w-full flex flex-col gap-2 sm:flex-col", !isMobile && "flex gap-2")}>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isDeleting}
                  onClick={form.handleSubmit(handleSubmit)}
                  className={cn(isMobile && "w-full order-1")}
                >
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onClose}
                  className={cn(isMobile && "w-full order-2")}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Modal da Calculadora */}
      <AlertDialog open={showCalculator} onOpenChange={setShowCalculator}>
        <AlertDialogContent className="p-0 w-[95vw] max-w-sm">
          <Calculator
            value={amountValue > 0 ? amountValue.toString() : "0"}
            onChange={handleCalculatorValue}
            onClose={() => setShowCalculator(false)}
          />
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
              {transaction.status === 'Concluído' && (
                <span className="block mt-2 text-sm font-medium">
                  O saldo da conta será ajustado automaticamente.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onAccountAdded={() => {
          fetchData();
          setIsAddAccountModalOpen(false);
        }}
      />
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onCategoryAdded={(newCategory) => {
          if (newCategory) {
            setCategories(prevCategories => [...prevCategories, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
            setTimeout(() => {
              form.setValue('category_id', newCategory.id, { shouldValidate: true });
            }, 0); 
          }
          setIsAddCategoryModalOpen(false);
        }}
        defaultType={transactionType}
      />
    </>
  );
};

export default TransactionDetailEditForm;