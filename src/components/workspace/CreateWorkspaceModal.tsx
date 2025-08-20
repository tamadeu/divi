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
import { showSuccess } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const workspaceSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório.").max(50, "O nome deve ter no máximo 50 caracteres."),
  description: z.string().max(200, "A descrição deve ter no máximo 200 caracteres.").optional(),
  isShared: z.boolean().default(false),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateWorkspaceModal = ({ isOpen, onClose }: CreateWorkspaceModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createWorkspace, switchWorkspace } = useWorkspace();

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      isShared: false,
    },
  });

  const handleSubmit = async (values: WorkspaceFormValues) => {
    setIsSubmitting(true);

    try {
      const newWorkspace = await createWorkspace(
        values.name,
        values.description || undefined,
        values.isShared
      );

      if (newWorkspace) {
        showSuccess("Núcleo financeiro criado com sucesso!");
        switchWorkspace(newWorkspace.id);
        form.reset();
        onClose();
      }
    } catch (error) {
      console.error("Error creating workspace:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Núcleo Financeiro</DialogTitle>
          <DialogDescription>
            Crie um novo núcleo para organizar suas finanças. Você pode criar núcleos pessoais ou compartilhados.
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
                {isSubmitting ? "Criando..." : "Criar Núcleo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceModal;