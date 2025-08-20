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
import { Checkbox } from "@/components/ui/checkbox";
import { showError, showSuccess } from "@/utils/toast";
import { Account, Bank } from "@/types/database";
import { Trash2 } from "lucide-react";

const editAccountSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  bank_selection: z.string().min(1, "Selecione um banco ou digite um novo."),
  custom_bank_name: z.string().optional(),
  type: z.string().min(1, "O tipo é obrigatório."),
  balance: z.coerce.number(),
  is_default: z.boolean().default(false),
}).refine(data => {
  if (data.bank_selection === "custom_bank_input") {
    return data.custom_bank_name && data.custom_bank_name.trim().length > 0;
  }
  return true;
}, {
  message: "O nome do novo banco é obrigatório.",
  path: ["custom_bank_name"],
});

type EditAccountFormValues = z.infer<typeof editAccountSchema>;

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountUpdated: () => void;
  account: Account | null;
}

const EditAccountModal = ({ isOpen, onClose, onAccountUpdated, account }: EditAccountModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<Bank[]>([]);
  const [showCustomBankInput, setShowCustomBankInput] = useState(false);

  const form = useForm<EditAccountFormValues>({
    resolver: zodResolver(editAccountSchema),
    defaultValues: {
      name: "",
      bank_selection: "",
      custom_bank_name: "",
      type: "",
      balance: 0,
      is_default: false,
    },
  });

  useEffect(() => {
    const fetchBanks = async () => {
      const { data, error } = await supabase
        .from("banks")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) {
        console.error("Error fetching banks:", error);
      } else {
        setAvailableBanks(data || []);
      }
    };

    if (isOpen && account) {
      fetchBanks();
      
      // Find if the bank exists in our banks table
      const existingBank = availableBanks.find(b => b.name === account.bank);
      const bankSelection = existingBank ? existingBank.id : "custom_bank_input";
      
      form.reset({
        name: account.name,
        bank_selection: bankSelection,
        custom_bank_name: existingBank ? "" : account.bank,
        type: account.type,
        balance: account.balance,
        is_default: account.is_default,
      });
      
      setShowCustomBankInput(!existingBank);
    }
  }, [isOpen, account, form, availableBanks]);

  const handleSubmit = async (values: EditAccountFormValues) => {
    if (!account) return;
    
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado para editar uma conta.");
      setIsSubmitting(false);
      return;
    }

    let bankNameToUpdate: string;
    if (values.bank_selection === "custom_bank_input") {
      bankNameToUpdate = values.custom_bank_name || "";
    } else {
      const selectedBank = availableBanks.find(b => b.id === values.bank_selection);
      bankNameToUpdate = selectedBank ? selectedBank.name : "";
    }

    try {
      // If setting as default, first unset all other accounts as default
      if (values.is_default) {
        const { error: unsetError } = await supabase.rpc('set_default_account', {
          account_id_to_set: account.id
        });
        
        if (unsetError) {
          throw unsetError;
        }
      }

      // Update the account
      const { error } = await supabase
        .from("accounts")
        .update({
          name: values.name,
          bank: bankNameToUpdate,
          type: values.type,
          balance: values.balance,
          is_default: values.is_default,
        })
        .eq("id", account.id);

      if (error) {
        throw error;
      }

      showSuccess("Conta atualizada com sucesso!");
      onAccountUpdated();
      onClose();
    } catch (error: any) {
      showError("Erro ao atualizar conta: " + error.message);
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!account) return;
    
    setIsDeleting(true);
    
    try {
      // First delete all transactions associated with this account
      const { error: transactionsError } = await supabase
        .from("transactions")
        .delete()
        .eq("account_id", account.id);

      if (transactionsError) {
        throw transactionsError;
      }

      // Then delete the account
      const { error: accountError } = await supabase
        .from("accounts")
        .delete()
        .eq("id", account.id);

      if (accountError) {
        throw accountError;
      }

      showSuccess("Conta excluída com sucesso!");
      onAccountUpdated();
      onClose();
    } catch (error: any) {
      showError("Erro ao excluir conta: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da sua conta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Conta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Conta Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bank_selection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "custom_bank_input") {
                        setShowCustomBankInput(true);
                        form.trigger("custom_bank_name");
                      } else {
                        setShowCustomBankInput(false);
                        form.setValue("custom_bank_name", "");
                        form.clearErrors("custom_bank_name");
                      }
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um banco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBanks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom_bank_input">
                        Não encontrou seu banco?
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showCustomBankInput && (
              <FormField
                control={form.control}
                name="custom_bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Novo Banco</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Meu Novo Banco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                      <SelectItem value="Poupança">Poupança</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Investimento">Investimento</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Atual</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Definir como conta padrão
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Esta conta será selecionada automaticamente ao criar transações.
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountModal;