"use client";

import { useState } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WorkspaceWithRole } from "@/types/workspace";
import { supabase } from "@/integrations/supabase/client";

const workspaceSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório.").max(50, "O nome deve ter no máximo 50 caracteres."),
  description: z.string().max(200, "A descrição deve ter no máximo 200 caracteres.").optional(),
  isShared: z.boolean().default(false),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

interface EditWorkspaceModalProps {
  workspace: WorkspaceWithRole;
  isOpen: boolean;
  onClose: () => void;
}

const EditWorkspaceModal = ({ workspace, isOpen, onClose }: EditWorkspaceModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshWorkspaces } = useWorkspace();

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description || "",
      isShared: workspace.is_shared,
    },
  });

  const handleSubmit = async (values: WorkspaceFormValues) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: values.name,
          description: values.description || null,
          is_shared: values.isShared,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspace.id);

      if (error) throw error;

      showSuccess("Núcleo financeiro atualizado com sucesso!");
      await refreshWorkspaces();
      onClose();
    } catch (error: any) {
      console.error("Error updating workspace:", error);
      showError("Erro ao atualizar núcleo financeiro: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Núcleo Financeiro</DialogTitle>
          <DialogDescription>
            Atualize as informações do seu núcleo financeiro.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Núcleo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Família, Empresa, Pessoal..." {...field} />
                  </FormControl>
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
                    <Textarea 
                      placeholder="Descreva o propósito deste núcleo financeiro..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isShared"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Núcleo Compartilhado
                    </FormLabel>
                    <FormDescription>
                      Permite adicionar outros usuários para colaborar neste núcleo financeiro.
                    </FormDescription>
                  </div>
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

export default EditWorkspaceModal;