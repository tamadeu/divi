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
import { showError, showSuccess } from "@/utils/toast";
import { Account } from "@/types/database";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const creditCardSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  brand: z.string().min(1, "A bandeira é obrigatória."),
  last_four_digits: z.string().length(4, "Deve conter exatamente 4 dígitos.").regex(/^\d{4}$/, "Deve conter apenas números."),
  credit_limit: z.coerce.number().min(0, "O limite deve ser um valor positivo."),
  closing_day: z.coerce.number().min(1, "Dia deve ser entre 1 e 31.").max(31, "Dia deve ser entre 1 e 31."),
  due_day: z.coerce.number().min(1, "Dia deve ser entre 1 e 31.").max(31, "Dia deve ser entre 1 e 31."),
  account_id: z.string().uuid("Selecione uma conta válida."),
});

type CreditCardFormValues = z.infer<typeof creditCardSchema>;

interface AddCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditCardAdded: () => void;
}

const CREDIT_CARD_BRANDS = [
  "Visa",
  "Mastercard",
  "American Express",
  "Elo",
  "Hipercard",
  "Diners Club",
  "Discover",
  "Outro"
];

const AddCreditCardModal = ({ isOpen, onClose, onCreditCardAdded }: AddCreditCardModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();

  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: "",
      brand: "",
      last_four_digits: "",
      credit_limit: 0,
      closing_day: 1,
      due_day: 10,
      account_id: "",
    },
  });

  const fetchAccounts = useCallback(async () => {
    if (!currentWorkspace) return;

    const { data: accountsData } = await supabase
      .from("accounts")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .neq("type", "Cartão de Crédito") // Excluir contas que já são cartão de crédito
      .order("name", { ascending: true });
    
    setAccounts(accountsData || []);
  }, [currentWorkspace]);

  useEffect(() => {
    if (isOpen && currentWorkspace) {
      fetchAccounts();
      form.reset({
        name: "",
        brand: "",
        last_four_digits: "",
        credit_limit: 0,
        closing_day: 1,
        due_day: 10,
        account_id: "",
      });
    }
  }, [isOpen, currentWorkspace, fetchAccounts, form]);

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

    const { error } = await supabase.from("credit_cards").insert({
      name: values.name,
      brand: values.brand,
      last_four_digits: values.last_four_digits,
      credit_limit: values.credit_limit,
      closing_day: values.closing_day,
      due_day: values.due_day,
      account_id: values.account_id,
      user_id: user.id,
      workspace_id: currentWorkspace.id,
    });

    if (error) {
      showError("Erro ao adicionar cartão de crédito: " + error.message);
      setIsSubmitting(false);
      return;
    }

    showSuccess("Cartão de crédito adicionado com sucesso!");
    onCreditCardAdded();
    onClose();
    setIsSubmitting(false);
  };

  if (!currentWorkspace) {
    return null;
  }

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
          <DialogTitle>Adicionar Cartão de Crédito</DialogTitle>
          <DialogDescription>
            Cadastre um novo cartão de crédito vinculado a uma conta existente.
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
                      <Input placeholder="Ex: Cartão Nubank" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a bandeira" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CREDIT_CARD_BRANDS.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input 
                        placeholder="1234" 
                        maxLength={4}
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          field.onChange(value);
                        }}
                      />
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="closing_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia do Fechamento</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="31" {...field} />
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
                      <FormLabel>Dia do Vencimento</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="31" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
            {isSubmitting ? "Adicionando..." : "Adicionar Cartão"}
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

export default AddCreditCardModal;