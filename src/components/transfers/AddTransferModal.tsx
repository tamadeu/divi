"use client"

import { useState, useEffect, useCallback } from "react";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AddCategoryModal from "../categories/AddCategoryModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calculator } from "@/components/ui/calculator";

const transferSchema = z.object({
  from_account_id: z.string().uuid("Selecione uma conta de origem."),
  to_account_id: z.string().uuid("Selecione uma conta de destino."),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  date: z.date({ required_error: "A data é obrigatória." }),
  category_id: z.string().uuid("Selecione uma categoria."),
  description: z.string().optional(),
}).refine(data => data.from_account_id !== data.to_account_id, {
  message: "A conta de origem e destino não podem ser a mesma.",
  path: ["to_account_id"],
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface AddTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferAdded: () => void;
}

const AddTransferModal = ({ isOpen, onClose, onTransferAdded }: AddTransferModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const isMobile = useIsMobile();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      date: new Date(),
      description: "",
    },
  });

  const amountValue = form.watch("amount");

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: accountsData } = await supabase.from("accounts").select("*").eq("user_id", user.id);
    setAccounts(accountsData || []);

    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "income")
      .order("name", { ascending: true });
    setIncomeCategories(categoriesData || []);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleSubmit = async (values: TransferFormValues) => {
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado.");
      setIsSubmitting(false);
      return;
    }

    const fromAccount = accounts.find(acc => acc.id === values.from_account_id);
    const toAccount = accounts.find(acc => acc.id === values.to_account_id);

    if (!fromAccount || !toAccount) {
      showError("Contas selecionadas são inválidas.");
      setIsSubmitting(false);
      return;
    }

    const transferId = crypto.randomUUID();
    const amount = Math.abs(values.amount);
    const date = values.date.toISOString();
    const description = values.description || `Transferência de ${fromAccount.name} para ${toAccount.name}`;

    const transactionsToInsert = [
      // Débito da conta de origem
      {
        user_id: user.id,
        account_id: fromAccount.id,
        name: `Transferência para ${toAccount.name}`,
        amount: -amount,
        date,
        description,
        status: 'Concluído',
        transfer_id: transferId,
        category_id: null,
      },
      // Crédito na conta de destino
      {
        user_id: user.id,
        account_id: toAccount.id,
        name: `Transferência de ${fromAccount.name}`,
        amount: amount,
        date,
        description,
        status: 'Concluído',
        transfer_id: transferId,
        category_id: values.category_id,
      },
    ];

    const { error: insertError } = await supabase.from("transactions").insert(transactionsToInsert);

    if (insertError) {
      showError("Erro ao criar transferência: " + insertError.message);
      setIsSubmitting(false);
      return;
    }

    // Atualizar saldos
    const { error: fromAccountError } = await supabase
      .from("accounts")
      .update({ balance: fromAccount.balance - amount })
      .eq("id", fromAccount.id);

    const { error: toAccountError } = await supabase
      .from("accounts")
      .update({ balance: toAccount.balance + amount })
      .eq("id", toAccount.id);

    if (fromAccountError || toAccountError) {
      showError("Transferência registrada, mas houve um erro ao atualizar os saldos das contas.");
    } else {
      showSuccess("Transferência realizada com sucesso!");
    }

    onTransferAdded();
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
            <DialogTitle>Nova Transferência Entre Contas</DialogTitle>
            <DialogDescription>
              Mova dinheiro de uma conta para outra.
            </DialogDescription>
          </DialogHeader>

          {/* Conteúdo com scroll */}
          <div className={cn(
            "flex-1 overflow-y-auto px-6 py-4",
            !isMobile && "max-h-[60vh]"
          )}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="from_account_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>De</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Conta de Origem" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="to_account_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Para</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Conta de Destino" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria da Entrada</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria de receita" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {incomeCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
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
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
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
              {isSubmitting ? "Transferindo..." : "Confirmar Transferência"}
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
      />
    </>
  );
};

export default AddTransferModal;