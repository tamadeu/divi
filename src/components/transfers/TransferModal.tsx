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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { Account, Category } from "@/types/database";
import { CalendarIcon, PlusCircle, Calculator as CalculatorIcon } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AddAccountModal from "../accounts/AddAccountModal";
import AddCategoryModal from "../categories/AddCategoryModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Calculator } from "@/components/ui/calculator";

const transferSchema = z.object({
  amount: z.coerce.number().positive("O valor deve ser um número positivo."),
  date: z.date({ required_error: "A data é obrigatória." }),
  from_account_id: z.string({ required_error: "Selecione uma conta de origem."}).uuid("Selecione uma conta de origem válida."),
  to_account_id: z.string({ required_error: "Selecione uma conta de destino."}).uuid("Selecione uma conta de destino válida."),
  category_id: z.string().uuid("Selecione uma categoria válida.").nullable().optional(), // Updated: allow null for optional category
  description: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.from_account_id === data.to_account_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A conta de origem e destino não podem ser a mesma.",
      path: ['to_account_id'],
    });
  }
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferCompleted: () => void;
  initialTransferData?: {
    fromAccountId?: string;
    toAccountId?: string;
    amount?: number;
  };
}

const TransferModal = ({ isOpen, onClose, onTransferCompleted, initialTransferData }: TransferModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      date: new Date(),
      from_account_id: "",
      to_account_id: "",
      category_id: null, // Updated: default to null
      description: "",
    },
  });

  const amountValue = form.watch("amount");

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;

    // Fetch accounts for the current workspace
    const { data: accountsData } = await supabase
      .from("accounts")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("name", { ascending: true });
    setAccounts(accountsData || []);

    // Fetch categories for the current workspace (both income and expense for transfers)
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("name", { ascending: true });
    setCategories(categoriesData || []);
  }, [currentWorkspace]);

  useEffect(() => {
    if (isOpen && currentWorkspace) {
      fetchData().then(() => {
        form.reset({
          amount: initialTransferData?.amount || 0,
          date: new Date(),
          from_account_id: initialTransferData?.fromAccountId || "",
          to_account_id: initialTransferData?.toAccountId || "",
          category_id: null, // Reset to null
          description: "",
        });
      });
    }
  }, [isOpen, initialTransferData, form, fetchData, currentWorkspace]);

  const sortedCategories = useMemo(() => {
    const filtered = categories;

    // Group by parent and sort
    const categoriesMap = new Map<string, Category>();
    filtered.forEach(cat => categoriesMap.set(cat.id, cat));

    const topLevelCategories = filtered.filter(cat => !cat.parent_category_id);
    const subCategories = filtered.filter(cat => cat.parent_category_id);

    const hierarchicalCategories: Category[] = [];

    topLevelCategories.sort((a, b) => a.name.localeCompare(b.name)).forEach(parent => {
      hierarchicalCategories.push(parent);
      subCategories
        .filter(sub => sub.parent_category_id === parent.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(sub => hierarchicalCategories.push({ ...sub, name: `- ${sub.name}` })); // Add hyphen for subcategories
    });

    return hierarchicalCategories;
  }, [categories]);

  const handleSubmit = async (values: TransferFormValues) => {
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

    try {
      // Create two transactions: one expense from 'from_account' and one income to 'to_account'
      // Both transactions will share a transfer_id to link them
      const transferId = crypto.randomUUID();

      const { error: fromTransactionError } = await supabase.from("transactions").insert({
        name: `Transferência para ${accounts.find(acc => acc.id === values.to_account_id)?.name || 'outra conta'}`,
        amount: -Math.abs(values.amount), // Expense
        date: values.date.toISOString(),
        account_id: values.from_account_id,
        category_id: values.category_id || null, // Use null if category_id is empty string or undefined
        status: "Concluído",
        description: values.description || "Transferência de fundos",
        user_id: user.id,
        workspace_id: currentWorkspace.id,
        transfer_id: transferId,
      });

      if (fromTransactionError) throw fromTransactionError;

      const { error: toTransactionError } = await supabase.from("transactions").insert({
        name: `Transferência de ${accounts.find(acc => acc.id === values.from_account_id)?.name || 'outra conta'}`,
        amount: Math.abs(values.amount), // Income
        date: values.date.toISOString(),
        account_id: values.to_account_id,
        category_id: values.category_id || null, // Use null if category_id is empty string or undefined
        status: "Concluído",
        description: values.description || "Transferência de fundos",
        user_id: user.id,
        workspace_id: currentWorkspace.id,
        transfer_id: transferId,
      });

      if (toTransactionError) throw toTransactionError;

      // Update balances for both accounts
      const fromAccount = accounts.find(acc => acc.id === values.from_account_id);
      const toAccount = accounts.find(acc => acc.id === values.to_account_id);

      if (fromAccount) {
        await supabase
          .from("accounts")
          .update({ balance: fromAccount.balance - values.amount })
          .eq("id", fromAccount.id);
      }
      if (toAccount) {
        await supabase
          .from("accounts")
          .update({ balance: toAccount.balance + values.amount })
          .eq("id", toAccount.id);
      }

      showSuccess("Transferência realizada com sucesso!");
      onTransferCompleted();
      onClose();
    } catch (error: any) {
      console.error("Erro ao realizar transferência:", error);
      showError("Erro ao realizar transferência: " + error.message);
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
          <DialogHeader className={cn("px-6 py-4 border-b flex-shrink-0")}>
            <DialogTitle>Nova Transferência</DialogTitle>
            <DialogDescription>
              Transfira fundos entre suas contas.
            </DialogDescription>
          </DialogHeader>
          
          <div className={cn(
            "flex-1 overflow-y-auto px-6 py-4",
            !isMobile && "max-h-[60vh]"
          )}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                      <FormLabel>Data da Transferência</FormLabel>
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
                  name="from_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta de Origem</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta de origem" />
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
                  name="to_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta de Destino</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta de destino" />
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
                      <FormLabel>Categoria (Opcional)</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select 
                          onValueChange={(value) => field.onChange(value === "null-category" ? null : value)} 
                          value={field.value || "null-category"} // Set default to "null-category" if field.value is null/undefined
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null-category">Nenhuma</SelectItem> {/* Updated value */}
                            {sortedCategories.map(cat => (
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
              {isSubmitting ? "Transferindo..." : "Realizar Transferência"}
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
        // For transfers, category type can be flexible, or we might not set a default
        // For now, let's not set a default type, allowing the user to choose.
      />
    </>
  );
};

export default TransferModal;