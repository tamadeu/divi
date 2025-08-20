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
import { showError, showSuccess } from "@/utils/toast";
import { Account, Bank } from "@/types/database";

const editAccountSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  bank_selection: z.string().min(1, "Selecione um banco ou digite um novo."),
  custom_bank_name: z.string().optional(),
  type: z.string().min(1, "O tipo é obrigatório."),
  balance: z.coerce.number(),
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
      fetchBanks().then(() => {
        // Check if the account's bank exists in the banks table
        const existingBank = availableBanks.find(bank => bank.name === account.bank);
        
        if (existingBank) {
          // Bank exists in the table
          form.reset({
            name: account.name,
            bank_selection: existingBank.id,
            custom_bank_name: "",
            type: account.type,
            balance: account.balance,
          });
          setShowCustomBankInput(false);
        } else {
          // Bank doesn't exist in table, use custom input
          form.reset({
            name: account.name,
            bank_selection: "custom_bank_input",
            custom_bank_name: account.bank,
            type: account.type,
            balance: account.balance,
          });
          setShowCustomBankInput(true);
        }
      });
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

    const { error } = await supabase
      .from("accounts")
      .update({
        name: values.name,
        bank: bankNameToUpdate,
        type: values.type,
        balance: values.balance,
      })
      .eq("id", account.id);

    if (error) {
      showError("Erro ao atualizar conta: " + error.message);
    } else {
      showSuccess("Conta atualizada com sucesso!");
      onAccountUpdated();
      onClose();
    }
    setIsSubmitting(false);
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
                    <FormLabel>Nome do Banco</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Meu Banco" {...field} />
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountModal;