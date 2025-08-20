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
import { Category } from "@/types/database";

const categorySchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  type: z.enum(["income", "expense"], { required_error: "O tipo é obrigatório." }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface EditCategoryModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onCategoryUpdated: () => void;
}

const EditCategoryModal = ({ category, isOpen, onClose, onCategoryUpdated }: EditCategoryModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (category) {
      form.reset(category);
    }
  }, [category, form]);

  const handleSubmit = async (values: CategoryFormValues) => {
    if (!category) return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado.");
      setIsSubmitting(false);
      return;
    }

    // Validação de nome e tipo únicos, excluindo a categoria atual
    const { data: existingCategories, error: fetchError } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", values.name)
      .eq("type", values.type)
      .neq("id", category.id); // Exclui a categoria atual da verificação

    if (fetchError) {
      showError("Erro ao verificar categorias existentes: " + fetchError.message);
      setIsSubmitting(false);
      return;
    }

    if (existingCategories && existingCategories.length > 0) {
      form.setError("name", {
        type: "manual",
        message: `Já existe outra categoria com o nome "${values.name}" e tipo "${values.type === 'income' ? 'Renda' : 'Despesa'}".`,
      });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("categories").update(values).eq("id", category.id);

    if (error) {
      showError("Erro ao atualizar categoria: " + error.message);
    } else {
      showSuccess("Categoria atualizada com sucesso!");
      onCategoryUpdated();
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogDescription>Atualize os detalhes da sua categoria.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Renda</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
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

export default EditCategoryModal;