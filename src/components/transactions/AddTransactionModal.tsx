"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CreditCard } from "@/types/credit-cards";
import { CalendarIcon, PlusCircle, Calculator as CalculatorIcon } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AddAccountModal from "../accounts/AddAccountModal";
import AddCategoryModal from "../categories/AddCategoryModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Calculator } from "@/components/ui/calculator";
import { Switch } from "@/components/ui/switch";

const transactionSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  type: z.enum(["income", "expense"], { required_error: "O tipo é obrigatório." }),
  amount: z.coerce.number().positive("O valor deve ser um número positivo."),
  date: z.date({ required_error: "A data é obrigatória." }),
  account_id: z.string({ required_error: "Selecione uma conta."}).uuid("Selecione uma conta válida."),
  category_id: z.string({ required_error: "Selecione uma categoria."}).uuid("Selecione uma categoria válida."),
  status: z.enum(["Concluído", "Pendente"]),
  description: z.string().optional(),
  is_credit_card: z.boolean().default(false),
  credit_card_id: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
  initialData?: any;
}

const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded, initialData }: AddTransactionModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [isNamePopoverOpen, setIsNamePopoverOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFutureDate, setIsFutureDate] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
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
      is_credit_card: false,
      credit_card_id: "",
    },
  });

  const transactionType = form.watch("type");
  const nameValue = form.watch("name");
  const transactionDate = form.watch("date");
  const amountValue = form.watch("amount");
  const isCreditCard = form.watch("is_credit_card");

  useEffect(() => {
    if (transactionDate) {
      const today = startOfDay(new Date());
      const selectedDate = startOfDay(transactionDate);

      if (selectedDate > today) {
        setIsFutureDate(true);
        form.setValue("status", "Pendente", { shouldValidate: true });
      } else {
        setIsFutureDate(false);
        form.setValue("status", "Concluído", { shouldValidate: true });
      }
    }
  }, [transactionDate, form]);

  const filteredCategories = useMemo(() => {
    if (!transactionType) return [];
    return categories.filter(c => c.type === transactionType);
  }, [categories, transactionType]);

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return { accounts: [], categories: [], creditCards: [] };

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

    // Buscar cartões de crédito do workspace atual
    const { data: creditCardsData } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .eq("is_active", true)
      .order("name", { ascending: true });
    setCreditCards(creditCardsData || []);

    return { accounts: accountsData || [], categories: categoriesData || [], creditCards: creditCardsData || [] };
  }, [currentWorkspace]);

  useEffect(() => {
    if (isOpen && currentWorkspace) {
      fetchData().then(({ accounts: fetchedAccounts }) => {
        const defaultAccountId = fetchedAccounts.find(acc => acc.is_default)?.id || "";

        if (initialData) {
          form.reset(initialData);
        } else {
          form.reset({
            name: "",
            amount: 0,
            date: new Date(),
            status: "Concluído",
            description: "",
            type: "expense",
            account_id: defaultAccountId, 
            category_id: "", 
            is_credit_card: false,
            credit_card_id: "",
          });
        }
      });
    }
  }, [isOpen, initialData, form, fetchData, currentWorkspace]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!isOpen || !transactionType || !currentWorkspace) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
  }, [isOpen, transactionType, currentWorkspace]);

  const filteredNameSuggestions = useMemo(() => {
    if (!nameValue) return [];
    return nameSuggestions.filter(s =>
      s.toLowerCase().includes(nameValue.toLowerCase()) && s.toLowerCase() !== nameValue.toLowerCase()
    );
  }, [nameValue, nameSuggestions]);

  useEffect(() => {
    if (transactionType && !initialData) {
      form.setValue('category_id', '');
    }
  }, [transactionType, form, initialData]);

  useEffect(() => {
    if (accounts.length > 0 && transactionType === 'expense' && !initialData) {
      const defaultAccount = accounts.find(acc => acc.is_default);
      if (defaultAccount && form.getValues('account_id') !== defaultAccount.id) {
        form.setValue('account_id', defaultAccount.id, { shouldValidate: true });
      }
    }
  }, [accounts, transactionType, form, initialData]);

  // Reset credit card when switching off credit card mode
  useEffect(() => {
    if (!isCreditCard) {
      form.setValue('credit_card_id', '');
    }
  }, [isCreditCard, form]);

  const handleSubmit = async (values: TransactionFormValues) => {
    if (!currentWorkspace) {
      showError("Nenhum núcleo financeiro selecionado.");
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado.");
      setIsSubmitting(false);
      return;
    }

    const amountToSave = values.type === 'expense' ? -Math.abs(values.amount) : Math.abs(values.amount);

    // Se for cartão de crédito, precisamos encontrar ou criar a fatura
    let creditCardBillId = null;
    if (values.is_credit_card && values.credit_card_id && values.type === 'expense') {
      // Buscar o cartão de crédito para obter as datas
      const { data: creditCard } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('id', values.credit_card_id)
        .single();

      if (creditCard) {
        // Calcular o mês de referência baseado na data da transação e dia de fechamento
        const transactionDate = new Date(values.date);
        const referenceMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1);
        
        // Se a transação é depois do dia de fechamento, vai para o próximo mês
        if (transactionDate.getDate() > creditCard.closing_day) {
          referenceMonth.setMonth(referenceMonth.getMonth() + 1);
        }

        // Buscar ou criar a fatura
        let { data: existingBill } = await supabase
          .from('credit_card_bills')
          .select('id')
          .eq('credit_card_id', values.credit_card_id)
          .eq('reference_month', referenceMonth.toISOString().split('T')[0])
          .single();

        if (!existingBill) {
          // Criar nova fatura
          const closingDate = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth(), creditCard.closing_day);
          const dueDate = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth(), creditCard.due_day);
          
          // Se o dia de vencimento é menor que o de fechamento, vai para o próximo mês
          if (creditCard.due_day <= creditCard.closing_day) {
            dueDate.setMonth(dueDate.getMonth() + 1);
          }

          const { data: newBill, error: billError } = await supabase
            .from('credit_card_bills')
            .insert({
              credit_card_id: values.credit_card_id,
              reference_month: referenceMonth.toISOString().split('T')[0],
              closing_date: closingDate.toISOString().split('T')[0],
              due_date: dueDate.toISOString().split('T')[0],
              total_amount: 0,
              paid_amount: 0,
              status: 'open',
              user_id: user.id,
              workspace_id: currentWorkspace.id,
            })
            .select('id')
            .single();

          if (billError) {
            showError("Erro ao criar fatura: " + billError.message);
            setIsSubmitting(false);
            return;
          }

          creditCardBillId = newBill.id;
        } else {
          creditCardBillId = existingBill.id;
        }
      }
    }

    const { error: transactionError } = await supabase.from("transactions").insert({
      name: values.name,
      amount: amountToSave,
      date: values.date.toISOString(),
      account_id: values.account_id,
      category_id: values.category_id,
      status: values.status,
      description: values.description,
      user_id: user.id,
      workspace_id: currentWorkspace.id,
      credit_card_bill_id: creditCardBillId,
    });

    if (transactionError) {
      showError("Erro ao adicionar transação: " + transactionError.message);
      setIsSubmitting(false);
      return;
    }

    // Só atualizar saldo da conta se não for cartão de crédito e estiver concluída
    if (values.status === 'Concluído' && !values.is_credit_card) {
      const selectedAccount = accounts.find(acc => acc.id === values.account_id);
      if (selectedAccount) {
        const newBalance = selectedAccount.balance + amountToSave;
        const { error: accountError } = await supabase
          .from("accounts")
          .update({ balance: newBalance })
          .eq("id", values.account_id);

        if (accountError) {
          showError("Transação adicionada, mas falha ao atualizar saldo: " + accountError.message);
        }
      }
    }

    showSuccess("Transação adicionada com sucesso!");
    onTransactionAdded();
    onClose();
    setIsSubmitting(false);
  };

  const handleCalculatorValue = (value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      form.setValue("amount", numericValue, { shouldValidate: true });
    }
    setShowCalculator(false);
  };

  if (!currentWorkspace) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className={cn(
            "sm:max-w-lg",
            isMobile ? "h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] p-0 flex flex-col" : "max-h-[90vh]"
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header fixo */}
          <DialogHeader className={cn(
            "px-6 py-4 border-b flex-shrink-0"
          )}>
            <DialogTitle>Adicionar Nova Transação</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da sua nova transação.
            </DialogDescription>
          </DialogHeader>
          
          {/* Conteúdo com scroll */}
          <div className={cn(
            "flex-1 overflow-y-auto px-6 py-4",
            !isMobile && "max-h-[60vh]"
          )}>
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
                            form.setValue("name", "");
                            form.setValue("is_credit_card", false);
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

                {/* Switch para Cartão de Crédito - apenas para despesas */}
                {transactionType === 'expense' && creditCards.length > 0 && (
                  <FormField
                    control={form.control}
                    name="is_credit_card"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Cartão de Crédito
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Esta despesa foi feita no cartão de crédito?
                          </div>
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
                )}

                {/* Seleção do Cartão de Crédito */}
                {isCreditCard && (
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
                            {creditCards.map(card => (
                              <SelectItem key={card.id} value={card.id}>
                                {card.name} •••• {card.last_four_digits}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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

                {/* Conta - apenas se não for cartão de crédito */}
                {!isCreditCard && (
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
                )}

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
                            {filteredCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
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
              </form>
            </Form>
          </div>

          {/* Footer fixo */}
          <DialogFooter className={cn(
            "px-6 py-4 border-t flex-shrink-0",
            isMobile && "flex-col gap-2 sm:flex-col"
          )}>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={form.handleSubmit(handleSubmit)}
              className={cn(isMobile && "w-full order-1")}
            >
              {isSubmitting ? "Adicionando..." : "Adicionar Transação"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className={cn(isMobile && "w-full order-2")}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal da Calculadora */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="p-0 w-[95vw] max-w-sm">
          <Calculator
            value={amountValue > 0 ? amountValue.toString() : "0"}
            onChange={handleCalculatorValue}
            onClose={() => setShowCalculator(false)}
          />
        </DialogContent>
      </Dialog>

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

export default AddTransactionModal;