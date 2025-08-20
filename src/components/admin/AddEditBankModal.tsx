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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showError, showSuccess } from "@/utils/toast";
import { Bank } from "@/types/database";
import { Building2 } from "lucide-react";

const bankSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve estar no formato hexadecimal (#000000)"),
});

type BankFormValues = z.infer<typeof bankSchema>;

interface AddEditBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBankSaved: () => void;
  bank?: Bank | null;
}

const AddEditBankModal = ({ isOpen, onClose, onBankSaved, bank }: AddEditBankModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!bank;

  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      name: "",
      logo_url: "",
      color: "#000000",
    },
  });

  const watchedColor = form.watch("color");
  const watchedLogoUrl = form.watch("logo_url");

  useEffect(() => {
    if (isOpen) {
      if (bank) {
        form.reset({
          name: bank.name,
          logo_url: bank.logo_url || "",
          color: bank.color,
        });
      } else {
        form.reset({
          name: "",
          logo_url: "",
          color: "#000000",
        });
      }
    }
  }, [isOpen, bank, form]);

  const handleSubmit = async (values: BankFormValues) => {
    setIsSubmitting(true);

    try {
      const bankData = {
        name: values.name,
        logo_url: values.logo_url || null,
        color: values.color,
      };

      if (isEditing && bank) {
        const { error } = await supabase
          .from("banks")
          .update(bankData)
          .eq("id", bank.id);

        if (error) throw error;
        showSuccess("Banco atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("banks")
          .insert(bankData);

        if (error) throw error;
        showSuccess("Banco adicionado com sucesso!");
      }

      onBankSaved();
      onClose();
    } catch (error: any) {
      showError(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} banco: ` + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Banco' : 'Adicionar Novo Banco'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do banco.' 
              : 'Preencha os dados do novo banco.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            {/* Preview do banco */}
            <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={watchedLogoUrl || ""} alt="Preview" />
                  <AvatarFallback 
                    className="text-white font-semibold"
                    style={{ backgroundColor: watchedColor }}
                  >
                    <Building2 className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{form.watch("name") || "Nome do Banco"}</p>
                  <p className="text-sm text-muted-foreground">{watchedColor}</p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Banco</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Banco Digital" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Logo (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://exemplo.com/logo.png" 
                      type="url"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor do Banco</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        placeholder="#000000" 
                        {...field}
                        className="flex-1"
                      />
                    </FormControl>
                    <input
                      type="color"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-12 h-10 rounded border border-input cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (isEditing ? "Salvando..." : "Adicionando...") 
                  : (isEditing ? "Salvar Alterações" : "Adicionar Banco")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditBankModal;