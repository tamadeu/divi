"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Users, User, Edit, Trash2, Shield, LogOut, Crown } from "lucide-react";
import { WorkspaceWithRole } from "@/types/workspace";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useSession } from "@/contexts/SessionContext";
import { useWorkspace } from "@/contexts/WorkspaceContext"; // Import useWorkspace

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
  const { refreshWorkspaces, switchWorkspace } = useWorkspace(); // Use useWorkspace hook

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
      
      // Se o workspace que saiu era o atual, mudar para outro
      const { data: remainingWorkspaces, error: fetchError } = await supabase
        .from('workspaces')
        .select('id')
        .neq('id', workspace.id)
        .limit(1);

      if (fetchError) throw fetchError;

      if (remainingWorkspaces && remainingWorkspaces.length > 0) {
        switchWorkspace(remainingWorkspaces[0].id);
      } else {
        // No other workspaces, clear current workspace
        switchWorkspace(''); // Or handle as appropriate for no workspace
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canManageMembers(workspace) && (
              <DropdownMenuItem onClick={() => onManageMembers(workspace)}>
                <Shield className="mr-2 h-4 w-4" />
                Gerenciar Membros
              </DropdownMenuItem>
            )}
            {canEdit(workspace) && (
              <DropdownMenuItem onClick={() => onEdit(workspace)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {canDelete(workspace) && (
              <DropdownMenuItem 
                onClick={() => onDelete(workspace)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            )}
            {canLeaveWorkspace(workspace) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair do Núcleo
                  </DropdownMenuItem>
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
            {!canManageMembers(workspace) && !canEdit(workspace) && !canDelete(workspace) && !canLeaveWorkspace(workspace) && (
              <DropdownMenuItem disabled>
                Nenhuma ação disponível
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
    </Card>
  );
}