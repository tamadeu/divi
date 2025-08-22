"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, User, UserX, Crown } from "lucide-react";
import { WorkspaceWithRole, WorkspaceUser } from "@/types/workspace";
import { useSession } from "@/contexts/SessionContext";

interface WorkspaceMemberCardMobileProps {
  member: WorkspaceUser;
  workspace: WorkspaceWithRole;
  onRemoveMember: (memberId: string) => void;
  onChangeRole: (memberId: string, newRole: 'admin' | 'user') => void;
  removingMemberId: string | null;
}

export function WorkspaceMemberCardMobile({
  member,
  workspace,
  onRemoveMember,
  onChangeRole,
  removingMemberId,
}: WorkspaceMemberCardMobileProps) {
  const { session } = useSession();

  const getMemberName = (m: WorkspaceUser) => {
    if (m.is_ghost_user) {
      return m.ghost_user_name || 'Usuário Fantasma';
    }
    // Usar first_name/last_name diretamente do objeto member
    if (m.first_name || m.last_name) {
      return `${m.first_name || ''} ${m.last_name || ''}`.trim();
    }
    if (m.email) {
      return m.email.split('@')[0];
    }
    return `Usuário ${m.user_id?.slice(0, 8) || 'Desconhecido'}`;
  };

  const getMemberEmail = (m: WorkspaceUser) => {
    if (m.is_ghost_user) {
      return m.ghost_user_email || 'Usuário fictício';
    }
    return m.email || 'Email não disponível';
  };

  const getMemberInitials = (m: WorkspaceUser) => {
    const name = getMemberName(m);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isCurrentUser = (m: WorkspaceUser) => {
    return m.user_id === session?.user?.id;
  };

  // Usar a flag is_owner que vem diretamente da RPC
  // const isWorkspaceOwner = (m: WorkspaceUser) => {
  //   return m.user_id === workspace.workspace_owner;
  // };

  const canRemoveMember = (m: WorkspaceUser) => {
    if (m.is_owner) return false; // Proprietário não pode ser removido
    return workspace.is_owner || workspace.user_role === 'admin'; // Só owner e admins podem remover
  };

  const canChangeRole = (m: WorkspaceUser) => {
    if (m.is_owner) return false; // Proprietário não pode ter papel alterado
    if (isCurrentUser(m) && workspace.is_owner) return false; // Owner não pode alterar seu próprio papel
    return workspace.is_owner || workspace.user_role === 'admin'; // Só owner e admins podem alterar papéis
  };

  const getMemberRole = (m: WorkspaceUser) => {
    if (m.is_owner) return 'Proprietário';
    return m.role === 'admin' ? 'Administrador' : 'Usuário';
  };

  const getMemberBadgeVariant = (m: WorkspaceUser) => {
    if (m.is_owner) return 'default';
    return m.role === 'admin' ? 'default' : 'outline';
  };

  const hasActions = canChangeRole(member) || canRemoveMember(member);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={member.avatar_url || undefined} /> {/* Usar avatar_url diretamente */}
            <AvatarFallback>
              {getMemberInitials(member)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg flex items-center gap-1">
              {getMemberName(member)}
              {isCurrentUser(member) && (
                <span className="ml-1 text-xs text-muted-foreground font-normal">(Você)</span>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {getMemberEmail(member)}
            </CardDescription>
          </div>
        </div>
        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canChangeRole(member) && (
                <>
                  {member.role === 'user' ? (
                    <DropdownMenuItem
                      onClick={() => onChangeRole(member.id, 'admin')}
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Promover a Admin
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => onChangeRole(member.id, 'user')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Rebaixar a Usuário
                    </DropdownMenuItem>
                  )}
                </>
              )}
              
              {canRemoveMember(member) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Remover Membro
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Membro</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover "{getMemberName(member)}" deste núcleo?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRemoveMember(member.id)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={removingMemberId === member.id}
                      >
                        {removingMemberId === member.id ? "Removendo..." : "Remover"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant={member.is_ghost_user ? "secondary" : "default"}>
            {member.is_ghost_user ? "Fictício" : "Real"}
          </Badge>
          <Badge variant={getMemberBadgeVariant(member)} className="flex items-center gap-1">
            {(member.role === 'admin' || member.is_owner) && (
              <Crown className="h-3 w-3 text-yellow-500" />
            )}
            {getMemberRole(member)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Adicionado em: {new Date(member.joined_at).toLocaleDateString('pt-BR')}
        </p>
      </CardContent>
    </Card>
  );
}