"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter, // Import CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, User, Edit, Trash2, Shield, LogOut, Crown } from "lucide-react"; // Removed MoreHorizontal
import { WorkspaceWithRole } from "@/types/workspace";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useSession } from "@/contexts/SessionContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface WorkspaceCardMobileProps {
  workspace: WorkspaceWithRole;
  onEdit: (workspace: WorkspaceWithRole) => void;
  onDelete: (workspace: WorkspaceWithRole) => void;
  onManageMembers: (workspace: WorkspaceWithRole) => void;
}

export function WorkspaceCardMobile({
  workspace,
  onEdit,
  onDelete,
  onManageMembers,
}: WorkspaceCardMobileProps) {
  const { session } = useSession();
  const { refreshWorkspaces, switchWorkspace } = useWorkspace();

  const handleLeaveWorkspace = async () => {
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from('workspace_users')
        .delete()
        .eq('workspace_id', workspace.id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      showSuccess(`Você saiu do núcleo "${workspace.name}" com sucesso!`);
      
      const { data: remainingWorkspaces, error: fetchError } = await supabase
        .from('workspaces')
        .select('id')
        .neq('id', workspace.id)
        .limit(1);

      if (fetchError) throw fetchError;

      if (remainingWorkspaces && remainingWorkspaces.length > 0) {
        switchWorkspace(remainingWorkspaces[0].id);
      } else {
        switchWorkspace('');
      }
      
      await refreshWorkspaces();
    } catch (error: any) {
      console.error('Error leaving workspace:', error);
      showError('Erro ao sair do núcleo: ' + error.message);
    }
  };

  const canEdit = (ws: WorkspaceWithRole) => {
    return ws.is_owner || ws.user_role === 'admin';
  };

  const canDelete = (ws: WorkspaceWithRole) => {
    return ws.is_owner;
  };

  const canManageMembers = (ws: WorkspaceWithRole) => {
    return ws.is_shared && (ws.is_owner || ws.user_role === 'admin');
  };

  const canLeaveWorkspace = (ws: WorkspaceWithRole) => {
    return ws.is_shared && !ws.is_owner;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {workspace.is_shared ? (
            <Users className="h-4 w-4 text-muted-foreground" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
          <CardTitle className="text-lg">{workspace.name}</CardTitle>
        </div>
        {/* Removed DropdownMenu here */}
      </CardHeader>
      <CardContent className="space-y-2">
        {workspace.description && (
          <CardDescription className="text-sm text-muted-foreground">
            {workspace.description}
          </CardDescription>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge variant={workspace.is_shared ? "default" : "secondary"}>
            {workspace.is_shared ? "Compartilhado" : "Pessoal"}
          </Badge>
          <Badge 
            variant={workspace.is_owner ? "default" : "outline"}
            className="flex items-center gap-1"
          >
            {workspace.is_owner && <Crown className="h-3 w-3" />}
            {workspace.is_owner ? "Proprietário" : 
             workspace.user_role === 'admin' ? "Administrador" : "Usuário"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Criado em: {format(new Date(workspace.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-4"> {/* Added CardFooter */}
        {canManageMembers(workspace) && (
          <Button variant="outline" size="sm" onClick={() => onManageMembers(workspace)}>
            <Shield className="mr-2 h-4 w-4" />
            Membros
          </Button>
        )}
        {canEdit(workspace) && (
          <Button variant="outline" size="sm" onClick={() => onEdit(workspace)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
        {canDelete(workspace) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Núcleo</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o núcleo "{workspace.name}"?
                  Esta ação não pode ser desfeita e excluirá todos os dados associados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(workspace)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {canLeaveWorkspace(workspace) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sair do Núcleo</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja sair do núcleo "{workspace.name}"?
                  Você perderá acesso a todas as informações financeiras deste núcleo.
                  Para voltar, será necessário ser convidado novamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLeaveWorkspace}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sair do Núcleo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}