"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Category } from "@/types/database";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const budgetSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria."),
  amount: z.string().min(1, "O valor é obrigatório.").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "O valor deve ser um número positivo."
  ),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBudgetAdded: () => void;
  selectedMonth: string;
}

const AddBudgetModal = ({ isOpen, onClose, onBudgetAdded, selectedMonth }: AddBudgetModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const { currentWorkspace } = useWorkspace();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
    },
  });

  const fetchCategories = async () => {
    if (!currentWorkspace) return;

    setLoadingCategories(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoadingCategories(false);
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("workspace_id", currentWorkspace.id)
      .eq("type", "Despesa")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      showError("Erro ao carregar categorias.");
    } else {
      setCategories(data || []);
    }
    setLoadingCategories(false);
  };

  useEffect(() => {
    if (isOpen && currentWorkspace) {
      fetchCategories();
    }
  }, [isOpen, currentWorkspace]);

  const handleSubmit = async (values: BudgetFormValues) => {
    if (!currentWorkspace) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("budgets").insert({
        user_id: user.id,
        workspace_id: currentWorkspace.id,
        category_id: values.categoryId,
        amount: Number(values.amount),
        month: `${selectedMonth}-01`,
      });

      if (error) throw error;

      showSuccess("Orçamento criado com sucesso!");
      form.reset();
      onBudgetAdded();
      onClose();
    } catch (error: any) {
      console.error("Error creating budget:", error);
      if (error.code === '23505') {
        showError("Já existe um orçamento para esta categoria neste mês.");
      } else {
        showError("Erro ao criar orçamento. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Orçamento</DialogTitle>
          <DialogDescription>
            Defina um orçamento para uma categoria específica.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingCategories ? (
                        <SelectItem value="loading" disabled>
                          Carregando...
                        </SelectItem>
                      ) : categories.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Nenhuma categoria de despesa encontrada
                        </SelectItem>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Orçamento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                    />
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
                {isSubmitting ? "Criando..." : "Criar Orçamento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBudgetModal;