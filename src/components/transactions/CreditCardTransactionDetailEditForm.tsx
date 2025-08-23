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
  FormDescription,
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
import { Category, CreditCard } from "@/types/database";
import { CalendarIcon, PlusCircle, Calculator as CalculatorIcon, Trash2 } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AddCategoryModal from "../categories/AddCategoryModal";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Calculator } from "@/components/ui/calculator";
import { Switch } from "@/components/ui/switch";
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
import { TransactionWithDetails } from "@/types/transaction-details"; // Import the new type

const creditCardTransactionSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  amount: z.coerce.number().positive("O valor deve ser um número positivo."),
  date: z.date({ required_error: "A data é obrigatória." }),
  credit_card_id: z.string({ required_error: "Selecione um cartão de crédito."}).uuid("Selecione um cartão de crédito válido."),
  category_id: z.string({ required_error: "Selecione uma categoria."}).uuid("Selecione uma categoria válida."),
  description: z.string().optional(),
  is_installment_purchase: z.boolean().default(false),
  installments: z.coerce.number().min(1, "O número de parcelas deve ser no mínimo 1.").optional(),
}).superRefine((data, ctx) => {
  if (data.is_installment_purchase && (!data.installments || data.installments < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Para compra parcelada, o número de parcelas deve ser maior que 1.",
      path: ['installments'],
    });
  }
});

type CreditCardTransactionFormValues = z.infer<typeof creditCardTransactionSchema>;

interface CreditCardTransactionDetailEditFormProps {
  transaction: TransactionWithDetails; // Use TransactionWithDetails
  onClose: () => void; // Function to navigate back
  onCreditCardTransactionUpdated: () => void;
  onCreditCardTransactionDeleted: () => void;
}

const CreditCardTransactionDetailEditForm = ({ transaction, onClose, onCreditCardTransactionUpdated, onCreditCardTransactionDeleted }: CreditCardTransactionDetailEditFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [isNamePopoverOpen, setIsNamePopoverOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();

  const form = useForm<CreditCardTransactionFormValues>({
    resolver: zodResolver(creditCardTransactionSchema),
    defaultValues: {
      name: "",
      amount: 0,
      date: new Date(),
      credit_card_id: "", 
      category_id: "", 
      description: "",
      is_installment_purchase: false,
      installments: 1,
    },
  });

  const nameValue = form.watch("name");
  const amountValue = form.watch("amount");
  const isInstallmentPurchase = form.watch("is_installment_purchase");

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return { creditCards: [], categories: [] };

    // Fetch all credit cards for the current workspace
    const { data: creditCardsData, error: creditCardsError } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("name", { ascending: true });
    
    if (creditCardsError) {
      console.error("Error fetching credit cards:", creditCardsError);
      showError("Erro ao carregar cartões de crédito.");
    } else {
      setCreditCards(creditCardsData || []);
    }

    // Fetch all expense categories for the current workspace
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .eq("type", "expense") // Cartão de crédito é sempre despesa
      .order("name", { ascending: true });
    
    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
      showError("Erro ao carregar categorias.");
    } else {
      setCategories(categoriesData || []);
    }

    return { creditCards: creditCardsData || [], categories: categoriesData || [] };
  }, [currentWorkspace]);

  // Effect to fetch data when component mounts or currentWorkspace changes
  useEffect(() => {
    if (currentWorkspace) {
      fetchData();
    }
  }, [currentWorkspace, fetchData]);

  // Effect to set form values once data is loaded and transaction is available
  useEffect(() => {
    if (transaction && creditCards.length > 0 && categories.length > 0) {
      console.log("CreditCardTransactionDetailEditForm: Initializing form with transaction data.");
      console.log("Transaction category_id:", transaction.category_id);
      console.log("Available categories:", categories.map(c => ({ id: c.id, name: c.name })));

      const absoluteAmount = Math.abs(transaction.amount);
      const isInstallment = (transaction.total_installments || 1) > 1;
      const installmentsCount = transaction.total_installments || 1;

      form.setValue("name", transaction.name, { shouldValidate: true });
      form.setValue("amount", absoluteAmount, { shouldValidate: true });
      form.setValue("date", new Date(transaction.date), { shouldValidate: true });
      form.setValue("credit_card_id", transaction.cc_id || "", { shouldValidate: true });
      form.setValue("category_id", transaction.category_id || "", { shouldValidate: true });
      form.setValue("description", transaction.description || "", { shouldValidate: true });
      form.setValue("is_installment_purchase", isInstallment, { shouldValidate: true });
      form.setValue("installments", installmentsCount, { shouldValidate: true });
    }
  }, [transaction, creditCards, categories, form]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentWorkspace) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar sugestões de nomes de transações de despesa do workspace atual
      const { data, error } = await supabase
        .from('transactions')
        .select('name, amount')
        .eq('workspace_id', currentWorkspace.id)
        .lt('amount', 0) // Apenas despesas
        .limit(500);

      if (error) {
        console.error("Error fetching transaction names:", error);
        return;
      }

      const filteredNames = data
        .map(t => t.name)
        .filter(name => !name.toLowerCase().startsWith('transferência'));

      const uniqueNames = [...new Set(filteredNames)];
      setNameSuggestions(uniqueNames);
    };

    fetchSuggestions();
  }, [currentWorkspace]);

  const filteredNameSuggestions = useMemo(() => {
    if (!nameValue) return [];
    return nameSuggestions.filter(s =>
      s.toLowerCase().includes(nameValue.toLowerCase()) && s.toLowerCase() !== nameValue.toLowerCase()
    );
  }, [nameValue, nameSuggestions]);

  const getOrCreateCreditCardBill = async (creditCardId: string, transactionDate: Date, userId: string, workspaceId: string): Promise<string | null> => {
    const creditCard = creditCards.find(cc => cc.id === creditCardId);

    if (!creditCard) {
      showError("Cartão de crédito não encontrado.");
      return null;
    }

    // Calculate closing and due dates for the bill
    let closingDate = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), creditCard.closing_day);
    let dueDate = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), creditCard.due_day);

    // Adjust if transaction date is after closing day, bill is for next month
    if (transactionDate.getDate() > creditCard.closing_day) {
        closingDate = addMonths(new Date(transactionDate.getFullYear(), transactionDate.getMonth(), creditCard.closing_day), 1);
        dueDate = addMonths(new Date(transactionDate.getFullYear(), transactionDate.getMonth(), creditCard.due_day), 1);
    } else {
        // If transaction date is before or on closing day, bill is for current month
        closingDate = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), creditCard.closing_day);
        dueDate = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), creditCard.due_day);
    }

    // Ensure the reference month for the bill is correct based on the closing date
    const billReferenceMonth = format(closingDate, 'yyyy-MM-01');

    // Check if a bill already exists for this card and reference month
    const { data: existingBill, error: fetchError } = await supabase
      .from('credit_card_bills')
      .select('id')
      .eq('credit_card_id', creditCardId)
      .eq('reference_month', billReferenceMonth)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error("Error fetching existing credit card bill:", fetchError);
      showError("Erro ao buscar fatura do cartão.");
      return null;
    }

    if (existingBill) {
      return existingBill.id;
    } else {
      // Create a new bill
      const { data: newBill, error: insertError } = await supabase
        .from('credit_card_bills')
        .insert({
          credit_card_id: creditCardId,
          reference_month: billReferenceMonth,
          closing_date: closingDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          total_amount: 0, // Will be updated by trigger
          paid_amount: 0,
          status: 'open',
          user_id: userId,
          workspace_id: workspaceId,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error("Error creating new credit card bill:", insertError);
        showError("Erro ao criar nova fatura do cartão.");
        return null;
      }
      return newBill.id;
    }
  };

  const handleSubmit = async (values: CreditCardTransactionFormValues) => {
    if (!transaction || !currentWorkspace) return;
    
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado.");
      setIsSubmitting(false);
      return;
    }

    try {
      const amountPerTransaction = -Math.abs(values.amount); // Credit card transactions are always expenses

      // If credit card or date changed, we might need a new bill or re-associate
      const newCreditCardBillId = await getOrCreateCreditCardBill(
        values.credit_card_id,
        values.date,
        user.id,
        currentWorkspace.id
      );

      if (!newCreditCardBillId) {
        setIsSubmitting(false);
        return;
      }

      const totalInstallments = values.is_installment_purchase ? (values.installments || 1) : 1;

      // If it was an installment purchase and now it's not, or vice-versa, or installments changed
      // Or if credit card changed, we need to delete old installments and create new ones.
      // Also, if the credit_card_bill_id changed, we need to recreate.
      if (
        transaction.credit_card_bill_id !== newCreditCardBillId ||
        (transaction.total_installments || 1) !== totalInstallments ||
        (transaction.total_installments || 1) > 1 !== values.is_installment_purchase
      ) {
        // Delete all transactions associated with the old credit_card_bill_id and original name
        // This is a simplified approach. A more robust solution would handle partial payments, etc.
        await supabase
          .from('transactions')
          .delete()
          .eq('credit_card_bill_id', transaction.credit_card_bill_id)
          .eq('name', transaction.name)
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspace.id);

        const transactionsToInsert = [];
        for (let i = 0; i < totalInstallments; i++) {
          const transactionDate = addMonths(values.date, i);
          transactionsToInsert.push({
            name: values.name,
            amount: amountPerTransaction,
            date: transactionDate.toISOString(),
            credit_card_bill_id: newCreditCardBillId,
            category_id: values.category_id,
            status: "Pendente", // Credit card transactions are pending until bill is paid
            description: values.description,
            user_id: user.id,
            workspace_id: currentWorkspace.id,
            installment_number: i + 1,
            total_installments: totalInstallments,
          });
        }

        const { error: insertError } = await supabase
          .from("transactions")
          .insert(transactionsToInsert);

        if (insertError) {
          showError("Erro ao recriar transação(ões) de cartão de crédito: " + insertError.message);
          setIsSubmitting(false);
          return;
        }

      } else {
        // If it's a single transaction or installment details didn't change significantly, just update the current one
        // This path is for updating a single transaction that is part of a non-installment or unchanged installment series
        const { error: transactionError } = await supabase
          .from("transactions")
          .update({
            name: values.name,
            amount: amountPerTransaction,
            date: values.date.toISOString(),
            credit_card_bill_id: newCreditCardBillId,
            category_id: values.category_id,
            description: values.description,
            // installment_number and total_installments should only be updated if it's a single transaction
            // For installment series, these values are managed by the recreation logic above.
            // If it's a single transaction, they should be 1.
            installment_number: totalInstallments === 1 ? 1 : transaction.installment_number, // Keep original installment number if part of series
            total_installments: totalInstallments === 1 ? 1 : transaction.total_installments, // Keep original total installments if part of series
            status: "Pendente", // Always pending for credit card transactions
          })
          .eq("id", transaction.id);

        if (transactionError) {
          showError("Erro ao atualizar transação de cartão de crédito: " + transactionError.message);
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(false); // Reset loading state
      onCreditCardTransactionUpdated(); // Call the success callback
    } catch (error: any) {
      console.error("Erro ao processar transação de cartão de crédito:", error);
      showError("Erro inesperado ao atualizar transação de cartão de crédito.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCalculatorValue = (value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      form.setValue("amount", numericValue, { shouldValidate: true });
    }
    setShowCalculator(false);
  };

  const handleDelete = async () => {
    if (!transaction || !currentWorkspace) return;
    setIsDeleting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError("Você precisa estar logado.");
        setIsDeleting(false); // Reset loading state
        return;
      }

      // Delete all transactions associated with this credit_card_bill_id and original name
      // This is important for installment purchases
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("credit_card_bill_id", transaction.credit_card_bill_id)
        .eq("name", transaction.name) // Ensure we delete only related installments
        .eq("user_id", user.id)
        .eq("workspace_id", currentWorkspace.id);

      if (error) {
        showError("Erro ao excluir transação(ões) de cartão de crédito: " + error.message);
        setIsDeleting(false); // Reset loading state
        return;
      }

      setIsDeleting(false); // Reset loading state
      setShowDeleteDialog(false); // Close dialog
      onCreditCardTransactionDeleted(); // Call the success callback
    } catch (error) {
      showError("Erro inesperado ao excluir transação de cartão de crédito.");
      setIsDeleting(false); // Reset loading state
    }
  };

  const filteredCategories = useMemo(() => {
    const filtered = categories.filter(c => c.type === 'expense'); // Always expense for credit card transactions

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
  }, [categories]);

  if (!currentWorkspace) {
    return null;
  }

  return (
    <>
      <div className="p-4 bg-card rounded-lg shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                              placeholder="Ex: Supermercado, Restaurante"
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
                  <FormLabel>Valor Total</FormLabel>
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
                  <FormLabel>Data da Compra</FormLabel>
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
              name="credit_card_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cartão de Crédito</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cartão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {creditCards.map(card => <SelectItem key={card.id} value={card.id}>{card.name} ({card.last_four_digits})</SelectItem>)}
                    </SelectContent>
                  </Select>
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
                    </Button>                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_installment_purchase"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Compra Parcelada?</FormLabel>
                    <FormDescription>
                      Marque se esta compra será dividida em parcelas.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isInstallmentPurchase && (
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Ex: 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
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
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowCalculator}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação de cartão de crédito? 
              Esta ação excluirá todas as parcelas associadas e não pode ser desfeita.
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
        defaultType="expense" // Credit card transactions are always expenses
      />
    </>
  );
};

export default CreditCardTransactionDetailEditForm;