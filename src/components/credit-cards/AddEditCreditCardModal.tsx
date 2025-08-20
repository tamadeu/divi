"use client";

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
import { showError, showSuccess } from "@/utils/toast";
import { Account, CreditCard } from "@/types/database";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const creditCardSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  account_id: z.string().uuid("Selecione uma conta válida."),
  brand: z.string().min(1, "A bandeira é obrigatória."),
  last_four_digits: z.string().length(4, "Os últimos 4 dígitos são obrigatórios e devem ter 4 caracteres."),
  credit_limit: z.coerce.number().positive("O limite de crédito deve ser um número positivo."),
  closing_day: z.coerce.number().min(1).max(31, "O dia de fechamento deve ser entre 1 e 31."),
  due_day: z.coerce.number().min(1).max(31, "O dia de vencimento deve ser entre 1 e 31."),
});

type CreditCardFormValues = z.infer<typeof creditCardSchema>;

interface AddEditCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditCardSaved: () => void;
  creditCard?: CreditCard | null; // Optional prop for editing
}

const AddEditCreditCardModal = ({ isOpen, onClose, onCreditCardSaved, creditCard }: AddEditCreditCardModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();

  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: "",
      account_id: "",
      brand: "",
      last_four_digits: "",
      credit_limit: 0,
      closing_day: 1,
      due_day: 1,
    },
  });

  const fetchAccounts = useCallback(async () => {
    if (!currentWorkspace) return;
    const { data, error } = await supabase
      .from("accounts")
      .select("id, name, type")
      .eq("workspace_id", currentWorkspace.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching accounts:", error);
      showError("Erro ao carregar contas.");
    } else {
      setAccounts(data || []);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (isOpen && currentWorkspace) {
      fetchAccounts();
      if (creditCard) {
        form.reset({
          name: creditCard.name,
          account_id: creditCard.account_id,
          brand: creditCard.brand,
          last_four_digits: creditCard.last_four_digits,
          credit_limit: creditCard.credit_limit,
          closing_day: creditCard.closing_day,
          due_day: creditCard.due_day,
        });
      } else {
        form.reset({
          name: "",
          account_id: "",
          brand: "",
          last_four_digits: "",
          credit_limit: 0,
          closing_day: 1,
          due_day: 1,
        });
      }
    }
  }, [isOpen, creditCard, form, fetchAccounts, currentWorkspace]);

  const handleSubmit = async (values: CreditCardFormValues) => {
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

    let error;
    if (creditCard) {
      // Update existing credit card
      const { error: updateError } = await supabase
        .from("credit_cards")
        .update({
          name: values.name,
          account_id: values.account_id,
          brand: values.brand,
          last_four_digits: values.last_four_digits,
          credit_limit: values.credit_limit,
          closing_day: values.closing_day,
          due_day: values.due_day,
          updated_at: new Date().toISOString(),
        })
        .eq("id", creditCard.id);
      error = updateError;
    } else {
      // Insert new credit card
      const { error: insertError } = await supabase
        .from("credit_cards")
        .insert({
          name: values.name,
          account_id: values.account_id,
          brand: values.brand,
          last_four_digits: values.last_four_digits,
          credit_limit: values.credit_limit,
          closing_day: values.closing_day,
          due_day: values.due_day,
          user_id: user.id,
          workspace_id: currentWorkspace.id,
        });
      error = insertError;
    }

    if (error) {
      showError(`Erro ao ${creditCard ? "atualizar" : "adicionar"} cartão de crédito: ` + error.message);
    } else {
      showSuccess(`Cartão de crédito ${creditCard ? "atualizado" : "adicionado"} com sucesso!`);
      onCreditCardSaved();
      onClose();
    }
    setIsSubmitting(false);
  };

  if (!currentWorkspace) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-lg",
          isMobile ? "h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] p-0 flex flex-col" : "max-h-[90vh]"
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className={cn("px-6 py-4 border-b flex-shrink-0")}>
          <DialogTitle>{creditCard ? "Editar Cartão de Crédito" : "Adicionar Novo Cartão de Crédito"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do seu cartão de crédito.
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cartão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Meu Cartão Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta Vinculada</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} ({acc.type})
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
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bandeira</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Visa, Mastercard, Elo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_four_digits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Últimos 4 Dígitos</FormLabel>
                    <FormControl>
                      <Input placeholder="XXXX" maxLength={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credit_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Crédito</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closing_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Fechamento da Fatura</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} placeholder="1-31" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Vencimento da Fatura</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} placeholder="1-31" {...field} />
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
            {isSubmitting ? (creditCard ? "Salvando..." : "Adicionando...") : (creditCard ? "Salvar Alterações" : "Adicionar Cartão")}
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
  );
};

export default AddEditCreditCardModal;