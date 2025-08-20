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
import { Account, Category, Transaction } from "@/types/database";
import { CalendarIcon, PlusCircle, Calculator as CalculatorIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AddCategoryModal from "../categories/AddCategoryModal";
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

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferCompleted: () => void; // Renomeado para ser mais genérico
  initialTransferData?: { fromTransaction: Transaction, toTransaction: Transaction } | null; // Dados para edição
}

const TransferModal = ({ isOpen, onClose, onTransferCompleted, initialTransferData }: TransferModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      date: new Date(),
      description: "",
      from_account_id: "",
      to_account_id: "",
      category_id: "",
    },
  });

  const amountValue = form.watch("amount");
  const fromAccountId = form.watch("from_account_id");

  // Filtrar contas de destino (excluir a conta de origem selecionada)
  const availableToAccounts = accounts.filter(acc => acc.id !== fromAccountId);

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

    // Pré-selecionar conta padrão como origem apenas se for uma nova transferência
    if (!initialTransferData && accountsData && accountsData.length > 0) {
      const defaultAccount = accountsData.find(acc => acc.is_default);
      if (defaultAccount) {
        form.setValue('from_account_id', defaultAccount.id, { shouldValidate: true });
      }
    }
  }, [form, initialTransferData]);

  useEffect(() => {
    if (isOpen) {
      fetchData().then(() => {
        if (initialTransferData) {
          const { fromTransaction, toTransaction } = initialTransferData;
          const initialCategoryId = toTransaction.category_id || "";

          form.reset({
            from_account_id: fromTransaction.account_id || "",
            to_account_id: toTransaction.account_id || "",
            amount: Math.abs(fromTransaction.amount),
            date: new Date(fromTransaction.date),
            category_id: initialCategoryId, // Set it initially
            description: fromTransaction.description || "",
          });

          // Explicitly set category_id again after a short delay
          // This can help if there's a race condition with Select options loading
          if (initialCategoryId) {
            setTimeout(() => {
              form.setValue('category_id', initialCategoryId, { shouldValidate: true });
            }, 50); // Small delay
          }
        } else {
          form.reset({
            amount: 0,
            date: new Date(),
            description: "",
            from_account_id: "",
            to_account_id: "",
            category_id: "",
          });
        }
      });
    }
  }, [isOpen, initialTransferData, fetchData, form]);

  // Limpar conta de destino se ela for igual à conta de origem
  useEffect(() => {
    const toAccountId = form.getValues("to_account_id");
    if (fromAccountId && toAccountId === fromAccountId) {
      form.setValue("to_account_id", "", { shouldValidate: true });
    }
  }, [fromAccountId, form]);

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

    const amount = Math.abs(values.amount);
    const date = values.date.toISOString();
    const description = values.description || `Transferência de ${fromAccount.name} para ${toAccount.name}`;

    if (initialTransferData) {
      // Lógica de EDIÇÃO de transferência
      const oldFromTransaction = initialTransferData.fromTransaction;
      const oldToTransaction = initialTransferData.toTransaction;
      const oldAmount = Math.abs(oldFromTransaction.amount);

      // 1. Reverter o impacto da transferência antiga nos saldos
      const { data: oldFromAccountData, error: oldFromAccountError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", oldFromTransaction.account_id)
        .single();
      const { data: oldToAccountData, error: oldToAccountError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", oldToTransaction.account_id)
        .single();

      if (oldFromAccountData && !oldFromAccountError) {
        await supabase
          .from("accounts")
          .update({ balance: oldFromAccountData.balance + oldAmount }) // Adiciona de volta o que foi debitado
          .eq("id", oldFromTransaction.account_id);
      }
      if (oldToAccountData && !oldToAccountError) {
        await supabase
          .from("accounts")
          .update({ balance: oldToAccountData.balance - oldAmount }) // Remove o que foi creditado
          .eq("id", oldToTransaction.account_id);
      }

      // 2. Atualizar as transações existentes
      const { error: updateFromError } = await supabase
        .from("transactions")
        .update({
          account_id: values.from_account_id,
          name: `Transferência para ${toAccount.name}`,
          amount: -amount,
          date,
          description,
          category_id: null, // Transação de saída não tem categoria de receita
        })
        .eq("id", oldFromTransaction.id);

      const { error: updateToError } = await supabase
        .from("transactions")
        .update({
          account_id: values.to_account_id,
          name: `Transferência de ${fromAccount.name}`,
          amount: amount,
          date,
          description,
          category_id: values.category_id,
        })
        .eq("id", oldToTransaction.id);

      if (updateFromError || updateToError) {
        showError("Erro ao atualizar transferência: " + (updateFromError?.message || updateToError?.message));
        setIsSubmitting(false);
        return;
      }

      // 3. Aplicar o impacto da nova transferência nos saldos
      const { data: currentFromAccountData, error: currentFromAccountError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", values.from_account_id)
        .single();
      const { data: currentToAccountData, error: currentToAccountError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", values.to_account_id)
        .single();

      if (currentFromAccountData && !currentFromAccountError) {
        await supabase
          .from("accounts")
          .update({ balance: currentFromAccountData.balance - amount })
          .eq("id", values.from_account_id);
      }
      if (currentToAccountData && !currentToAccountError) {
        await supabase
          .from("accounts")
          .update({ balance: currentToAccountData.balance + amount })
          .eq("id", values.to_account_id);
      }

      showSuccess("Transferência atualizada com sucesso!");

    } else {
      // Lógica de CRIAÇÃO de nova transferência
      const transferId = crypto.randomUUID();
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
    }

    onTransferCompleted();
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

  const handleCategoryAdded = async (newCategory: Category | null) => {
    setIsAddCategoryModalOpen(false);
    
    if (newCategory) {
      // Primeiro, atualizar a lista de categorias
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "income")
          .order("name", { ascending: true });
        
        setIncomeCategories(categoriesData || []);
        
        // Aguardar a atualização do estado antes de selecionar a categoria
        setTimeout(() => {
          form.setValue('category_id', newCategory.id, { shouldValidate: true });
        }, 100);
      }
    }
  };

  const handleDeleteTransfer = async () => {
    if (!initialTransferData) return;
    setIsDeleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError("Você precisa estar logado.");
        return;
      }

      const fromTransaction = initialTransferData.fromTransaction;
      const toTransaction = initialTransferData.toTransaction;
      const amount = Math.abs(fromTransaction.amount);

      // Reverter o impacto da transferência nos saldos das contas
      const { data: fromAccountData, error: fromAccError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", fromTransaction.account_id)
        .single();
      const { data: toAccountData, error: toAccError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", toTransaction.account_id)
        .single();

      if (fromAccountData && !fromAccError) {
        await supabase
          .from("accounts")
          .update({ balance: fromAccountData.balance + amount }) // Adiciona de volta o que foi debitado
          .eq("id", fromTransaction.account_id);
      }
      if (toAccountData && !toAccError) {
        await supabase
          .from("accounts")
          .update({ balance: toAccountData.balance - amount }) // Remove o que foi creditado
          .eq("id", toTransaction.account_id);
      }

      // Deletar ambas as transações da transferência
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .in("id", [fromTransaction.id, toTransaction.id])
        .eq("user_id", user.id);

      if (deleteError) {
        showError("Erro ao excluir transferência: " + deleteError.message);
        return;
      }

      showSuccess("Transferência excluída com sucesso!");
      onTransferCompleted();
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      showError("Erro inesperado ao excluir transferência.");
    } finally {
      setIsDeleting(false);
    }
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
            <DialogTitle>{initialTransferData ? "Editar Transferência" : "Nova Transferência Entre Contas"}</DialogTitle>
            <DialogDescription>
              {initialTransferData ? "Modifique os detalhes da sua transferência." : "Mova dinheiro de uma conta para outra."}
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Conta de Destino" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableToAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
            isMobile ? "flex-col gap-2 sm:flex-col" : "flex-row justify-between"
          )}>
            {initialTransferData && (
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
            )}
            <div className={cn(isMobile && "w-full flex flex-col gap-2 sm:flex-col", !isMobile && "flex gap-2", !initialTransferData && "w-full flex justify-end")}>
              <Button 
                type="submit" 
                disabled={isSubmitting || isDeleting}
                onClick={form.handleSubmit(handleSubmit)}
                className={cn(isMobile && "w-full order-1")}
              >
                {isSubmitting ? (initialTransferData ? "Salvando..." : "Transferindo...") : (initialTransferData ? "Salvar Alterações" : "Confirmar Transferência")}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão da Transferência</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transferência? Esta ação removerá ambas as transações vinculadas e ajustará os saldos das contas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransfer}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir Transferência"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onCategoryAdded={handleCategoryAdded}
        defaultType="income"
      />
    </>
  );
};

export default TransferModal;