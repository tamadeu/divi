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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { WorkspaceWithRole } from "@/types/workspace";
import { User, UserPlus } from "lucide-react";

const realUserSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  role: z.enum(["admin", "user"], { required_error: "Selecione um papel" }),
});

const ghostUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  role: z.enum(["admin", "user"], { required_error: "Selecione um papel" }),
});

type RealUserFormValues = z.infer<typeof realUserSchema>;
type GhostUserFormValues = z.infer<typeof ghostUserSchema>;

interface AddMemberModalProps {
  workspace: WorkspaceWithRole;
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

const AddMemberModal = ({ workspace, isOpen, onClose, onMemberAdded }: AddMemberModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberType, setMemberType] = useState<"real" | "ghost">("real");

  const realUserForm = useForm<RealUserFormValues>({
    resolver: zodResolver(realUserSchema),
    defaultValues: {
      email: "",
      role: "user",
    },
  });

  const ghostUserForm = useForm<GhostUserFormValues>({
    resolver: zodResolver(ghostUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
    },
  });

  const handleAddRealUser = async (values: RealUserFormValues) => {
    setIsSubmitting(true);

    try {
      // Buscar usuário usando a função edge
      const { data: userData, error: findError } = await supabase.functions.invoke('find-user-by-email', {
        body: { email: values.email }
      });

      if (findError) {
        console.error('Error finding user:', findError);
        showError('Erro ao buscar usuário: ' + findError.message);
        return;
      }

      if (!userData?.user) {
        showError('Usuário não encontrado na plataforma. Verifique o email ou crie um usuário fantasma.');
        return;
      }

      // Verificar se o usuário já é membro do workspace (sem usar .single())
      const { data: existingMembers, error: memberError } = await supabase
        .from('workspace_users')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('user_id', userData.user.id);

      if (memberError) {
        console.error('Error checking existing member:', memberError);
        throw memberError;
      }

      if (existingMembers && existingMembers.length > 0) {
        showError('Este usuário já é membro deste núcleo.');
        return;
      }

      // Adicionar o usuário ao workspace
      const { error: insertError } = await supabase
        .from('workspace_users')
        .insert({
          workspace_id: workspace.id,
          user_id: userData.user.id,
          role: values.role,
          is_ghost_user: false,
        });

      if (insertError) throw insertError;

      showSuccess(`Usuário ${userData.user.email} adicionado com sucesso!`);
      realUserForm.reset();
      onMemberAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding real user:', error);
      showError('Erro ao adicionar usuário: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddGhostUser = async (values: GhostUserFormValues) => {
    setIsSubmitting(true);

    try {
      // Adicionar usuário fantasma ao workspace
      const { error } = await supabase
        .from('workspace_users')
        .insert({
          workspace_id: workspace.id,
          user_id: null, // Usuário fantasma não tem user_id
          role: values.role,
          is_ghost_user: true,
          ghost_user_name: values.name,
          ghost_user_email: values.email || null,
        });

      if (error) throw error;

      showSuccess(`Usuário fantasma "${values.name}" criado com sucesso!`);
      ghostUserForm.reset();
      onMemberAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding ghost user:', error);
      showError('Erro ao criar usuário fantasma: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    realUserForm.reset();
    ghostUserForm.reset();
    setMemberType("real");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
          <DialogDescription>
            Adicione um usuário real da plataforma ou crie um usuário fictício para representar alguém.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={memberType} onValueChange={(value) => setMemberType(value as "real" | "ghost")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="real" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Usuário Real
            </TabsTrigger>
            <TabsTrigger value="ghost" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Usuário Fictício
            </TabsTrigger>
          </TabsList>

          <TabsContent value="real" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Convide um usuário que já possui conta na plataforma.
            </div>
            <Form {...realUserForm}>
              <form onSubmit={realUserForm.handleSubmit(handleAddRealUser)} className="space-y-4">
                <FormField
                  control={realUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Usuário</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="usuario@exemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Digite o email de um usuário já cadastrado na plataforma.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={realUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Papel no Núcleo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o papel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Administradores podem gerenciar membros e configurações do núcleo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adicionando..." : "Adicionar Usuário"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="ghost" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Crie um usuário fictício para representar alguém que não usa a plataforma.
            </div>
            <Form {...ghostUserForm}>
              <form onSubmit={ghostUserForm.handleSubmit(handleAddGhostUser)} className="space-y-4">
                <FormField
                  control={ghostUserForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Maria Silva"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Nome da pessoa que este usuário fictício representa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ghostUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="maria@exemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Email para identificação (não precisa ser real).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ghostUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Papel no Núcleo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o papel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Usuários fictícios geralmente são apenas "Usuário".
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Criando..." : "Criar Usuário Fictício"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberModal;