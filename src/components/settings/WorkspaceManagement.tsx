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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { MoreHorizontal, Plus, Users, User, Edit, Trash2, Shield, LogOut } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WorkspaceWithRole } from "@/types/workspace";
import CreateWorkspaceModal from "@/components/workspace/CreateWorkspaceModal";
import EditWorkspaceModal from "@/components/settings/EditWorkspaceModal";
import DeleteWorkspaceModal from "@/components/settings/DeleteWorkspaceModal";
import WorkspaceMembersModal from "@/components/settings/WorkspaceMembersModal";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useSession } from "@/contexts/SessionContext";

export function WorkspaceManagement() {
  const { session } = useSession();
  const { workspaces, loading, refreshWorkspaces, switchWorkspace } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [managingMembersWorkspace, setManagingMembersWorkspace] = useState<WorkspaceWithRole | null>(null);

  const handleEdit = (workspace: WorkspaceWithRole) => {
    setEditingWorkspace(workspace);
  };

  const handleDelete = (workspace: WorkspaceWithRole) => {
    setDeletingWorkspace(workspace);
  };

  const handleManageMembers = (workspace: WorkspaceWithRole) => {
    setManagingMembersWorkspace(workspace);
  };

  const handleLeaveWorkspace = async (workspace: WorkspaceWithRole) => {
    if (!session?.user) return;

    try {
      // Remover o usuário do workspace
      const { error } = await supabase
        .from('workspace_users')
        .delete()
        .eq('workspace_id', workspace.id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      showSuccess(`Você saiu do núcleo "${workspace.name}" com sucesso!`);
      
      // Se o workspace que saiu era o atual, mudar para outro
      const remainingWorkspaces = workspaces.filter(w => w.id !== workspace.id);
      if (remainingWorkspaces.length > 0) {
        switchWorkspace(remainingWorkspaces[0].id);
      }
      
      await refreshWorkspaces();
    } catch (error: any) {
      console.error('Error leaving workspace:', error);
      showError('Erro ao sair do núcleo: ' + error.message);
    }
  };

  const canEdit = (workspace: WorkspaceWithRole) => {
    return workspace.is_owner || workspace.user_role === 'admin';
  };

  const canDelete = (workspace: WorkspaceWithRole) => {
    return workspace.is_owner;
  };

  const canManageMembers = (workspace: WorkspaceWithRole) => {
    return workspace.is_shared && (workspace.is_owner || workspace.user_role === 'admin');
  };

  const canLeaveWorkspace = (workspace: WorkspaceWithRole) => {
    // Usuário pode sair se não for o proprietário e for um workspace compartilhado
    return workspace.is_shared && !workspace.is_owner;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Núcleos Financeiros</CardTitle>
          <CardDescription>Gerencie seus núcleos financeiros.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Núcleos Financeiros</CardTitle>
              <CardDescription>
                Gerencie seus núcleos financeiros. Você pode criar, editar e excluir núcleos.
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Núcleo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workspaces.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Você ainda não possui núcleos financeiros.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Núcleo
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto"> {/* Adicionado overflow-x-auto aqui */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaces.map((workspace) => (
                    <TableRow key={workspace.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {workspace.is_shared ? (
                            <Users className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium">{workspace.name}</div>
                            {workspace.description && (
                              <div className="text-sm text-muted-foreground">
                                {workspace.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={workspace.is_shared ? "default" : "secondary"}>
                          {workspace.is_shared ? "Compartilhado" : "Pessoal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={workspace.is_owner ? "default" : "outline"}
                        >
                          {workspace.is_owner ? "Proprietário" : 
                           workspace.user_role === 'admin' ? "Administrador" : "Usuário"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(workspace.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManageMembers(workspace) && (
                              <DropdownMenuItem onClick={() => handleManageMembers(workspace)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Gerenciar Membros
                              </DropdownMenuItem>
                            )}
                            {canEdit(workspace) && (
                              <DropdownMenuItem onClick={() => handleEdit(workspace)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete(workspace) && (
                              <DropdownMenuItem 
                                onClick={() => handleDelete(workspace)}
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
                                      onClick={() => handleLeaveWorkspace(workspace)}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {editingWorkspace && (
        <EditWorkspaceModal
          workspace={editingWorkspace}
          isOpen={!!editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
        />
      )}

      {deletingWorkspace && (
        <DeleteWorkspaceModal
          workspace={deletingWorkspace}
          isOpen={!!deletingWorkspace}
          onClose={() => setDeletingWorkspace(null)}
        />
      )}

      {managingMembersWorkspace && (
        <WorkspaceMembersModal
          workspace={managingMembersWorkspace}
          isOpen={!!managingMembersWorkspace}
          onClose={() => setManagingMembersWorkspace(null)}
        />
      )}
    </>
  );
}