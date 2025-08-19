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
import { CalendarIcon, PlusCircle } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AddAccountModal from "../accounts/AddAccountModal";
import AddCategoryModal from "../categories/AddCategoryModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

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

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
}

const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded }: AddTransactionModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [isNamePopoverOpen, setIsNamePopoverOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFutureDate, setIsFutureDate] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      name: "",
      amount: 0,
      date: new Date(),
      status: "Concluído",
      description: "",
      type: "expense",
    },
  });

  const transactionType = form.watch("type");
  const nameValue = form.watch("name");
  const transactionDate = form.watch("date");

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: accountsData } = await supabase.from("accounts").select("*").eq("user_id", user.id);
    setAccounts(accountsData || []);

    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });
    setCategories(categoriesData || []);
  }, []);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        amount: 0,
        date: new Date(),
        status: "Concluído",
        description: "",
        type: "expense",
      });
      fetchData();
    }
  }, [isOpen, form, fetchData]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!isOpen || !transactionType) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('name, amount')
        .eq('user_id', user.id)
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
  }, [isOpen, transactionType]);

  const filteredNameSuggestions = useMemo(() => {
    if (!nameValue) return [];
    return nameSuggestions.filter(s =>
      s.toLowerCase().includes(nameValue.toLowerCase()) && s.toLowerCase() !== nameValue.toLowerCase()
    );
  }, [nameValue, nameSuggestions]);

  useEffect(() => {
    if (transactionType) {
      form.setValue('category_id', '');
    }
  }, [transactionType, form]);

  useEffect(() => {
    if (accounts.length > 0 && transactionType === 'expense') {
      const defaultAccount = accounts.find(acc => acc.is_default);
      if (defaultAccount) {
        form.setValue('account_id', defaultAccount.id);
      }
    }
  }, [accounts, transactionType, form]);

  const handleSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado.");
      setIsSubmitting(false);
      return;
    }

    const amountToSave = values.type === 'expense' ? -Math.abs(values.amount) : Math.abs(values.amount);

    const { error: transactionError } = await supabase.from("transactions").insert({
      name: values.name,
      amount: amountToSave,
      date: values.date.toISOString(),
      account_id: values.account_id,
      category_id: values.category_id,
      status: values.status,
      description: values.description,
      user_id: user.id,
    });

    if (transactionError) {
      showError("Erro ao adicionar transação: " + transactionError.message);
      setIsSubmitting(false);
      return;
    }

    if (values.status === 'Concluído') {
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Transação</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da sua nova transação.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
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
               <div className="grid grid-cols-2 gap-4">
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              <div className="grid grid-cols-2 gap-4">
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
              </div>
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
                          <TabsTrigger value="Pendente">
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
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adicionando..." : "Adicionar Transação"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
          fetchData().then(() => {
            if (newCategory) {
              form.setValue('category_id', newCategory.id, { shouldValidate: true });
            }
          });
          setIsAddCategoryModalOpen(false);
        }}
        defaultType={transactionType}
      />
    </>
  );
};

export default AddTransactionModal;