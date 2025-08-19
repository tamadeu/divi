"use client"

import { useState, useEffect } from "react";
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
import { Account } from "@/types/database";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const transferSchema = z.object({
  from_account_id: z.string().uuid("Selecione uma conta de origem."),
  to_account_id: z.string().uuid("Selecione uma conta de destino."),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  date: z.date({ required_error: "A data é obrigatória." }),
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

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      date: new Date(),
      description: "",
    },
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("accounts").select("*").eq("user_id", user.id);
      setAccounts(data || []);
    };
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

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
        category_id: null,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Transferência Entre Contas</DialogTitle>
          <DialogDescription>
            Mova dinheiro de uma conta para outra.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
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
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Transferindo..." : "Confirmar Transferência"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransferModal;