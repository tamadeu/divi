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
import { showError, showSuccess } from "@/utils/toast";
import { BudgetWithSpending } from "@/types/database";
import { Loader2, Trash2 } from "lucide-react";

const editBudgetSchema = z.object({
  amount: z.coerce.number().positive("O valor do orçamento deve ser positivo."),
});

type EditBudgetFormValues = z.infer<typeof editBudgetSchema>;

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBudgetUpdated: () => void;
  budget: BudgetWithSpending | null;
  onDeleteRequest: (budget: BudgetWithSpending) => void;
}

const EditBudgetModal = ({ isOpen, onClose, onBudgetUpdated, budget, onDeleteRequest }: EditBudgetModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const form = useForm<EditBudgetFormValues>({
    resolver: zodResolver(editBudgetSchema),
    defaultValues: {
      amount: 0,
    },
  });

  useEffect(() => {
    if (isOpen && budget && !isFormInitialized) {
      form.reset({
        amount: budget.budgeted_amount,
      });
      setIsFormInitialized(true);
    } else if (!isOpen) {
      setIsFormInitialized(false); // Reset for next open
    }
  }, [isOpen, budget, isFormInitialized, form]);

  const handleSubmit = async (values: EditBudgetFormValues) => {
    if (!budget) return;
    
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Você precisa estar logado para editar um orçamento.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("budgets")
        .update({
          amount: values.amount,
        })
        .eq("id", budget.id)
        .eq("user_id", user.id); // Ensure user owns the budget

      if (error) {
        throw error;
      }

      showSuccess("Orçamento atualizado com sucesso!");
      onBudgetUpdated();
      onClose();
    } catch (error: any) {
      showError("Erro ao atualizar orçamento: " + error.message);
      console.error("Update budget error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateDelete = () => {
    if (budget) {
      onDeleteRequest(budget);
      onClose(); // Close the edit modal
    }
  };

  if (!budget) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Editar Orçamento</DialogTitle>
          <DialogDescription>
            Atualize o valor do orçamento para a categoria "{budget.category_name}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Orçamento</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={handleInitiateDelete} 
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBudgetModal;