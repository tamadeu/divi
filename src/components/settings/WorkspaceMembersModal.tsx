"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Plus, User, UserX, Crown, Shield, ArrowRightLeft } from "lucide-react";
import { WorkspaceWithRole, WorkspaceUser } from "@/types/workspace";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/contexts/SessionContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import AddMemberModal from "./AddMemberModal";
import TransferOwnershipModal from "./TransferOwnershipModal";
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
import { WorkspaceMemberCardMobile } from "./WorkspaceMemberCardMobile"; // Import the new component

interface WorkspaceMembersModalProps {
  workspace: WorkspaceWithRole;
  isOpen: boolean;
  onClose: () => void;
}

const WorkspaceMembersModal = ({ workspace, isOpen, onClose }: WorkspaceMembersModalProps) => {
  const { session } = useSession();
  const { refreshWorkspaces } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's 'md' breakpoint is 768px
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchMembers = useCallback(async () => {
    if (!workspace.id) return;

    setLoading(true);
    try {
      // Chamar a nova função RPC para obter todos os detalhes dos membros
      const { data, error } = await supabase
        .rpc('get_workspace_members_with_details', { p_workspace_id: workspace.id });

      if (error) {
        console.error('Error fetching workspace members with details:', error);
        throw error;
      }

      // O tipo retornado pela RPC já é compatível com WorkspaceUser[]
      setMembers(data || []);

    } catch (error: any) {
      console.error('Error fetching members:', error);
      showError('Erro ao carregar membros do núcleo');
    } finally {
      setLoading(false);
    }
  }, [workspace.id, showError]);

  useEffect(() => {
    if (isOpen && workspace.id) {
      fetchMembers();
    }
  }, [isOpen, workspace.id, fetchMembers]);

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    
    try {
      const { error } = await supabase
        .from('workspace_users')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      showSuccess('Membro removido com sucesso!');
      await fetchMembers();
      await refreshWorkspaces(); // Atualizar lista de workspaces
    } catch (error: any) {
      console.error('Error removing member:', error);
      showError('Erro ao remover membro');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'user') => {
    console.log(`Attempting to change role for memberId: ${memberId} to ${newRole}`); // Debug log
    try {
      const { error } = await supabase
        .from('workspace_users')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) {
        console.error('Supabase error changing member role:', error); // More specific error log
        throw error;
      }

      showSuccess('Papel do membro atualizado com sucesso!');
      await fetchMembers();
      await refreshWorkspaces(); // Adicionado: Atualiza o contexto do workspace para refletir as novas permissões
    } catch (error: any) {
      console.error('Error changing member role:', error);
      showError('Erro ao alterar papel do membro: ' + error.message); // Show error message
    }
  };

  // Helper functions for member display and permissions
  const getMemberName = (member: WorkspaceUser) => {
    if (member.is_ghost_user) {
      return member.ghost_user_name || 'Usuário Fantasma';
    }
    
    if (member.first_name || member.last_name) { // Usar first_name/last_name diretamente do objeto member
      return `${member.first_name || ''} ${member.last_name || ''}`.trim();
    }
    
    if (member.email) {
      return member.email.split('@')[0];
    }
    
    return `Usuário ${member.user_id?.slice(0, 8) || 'Desconhecido'}`;
  };

  const getMemberEmail = (member: WorkspaceUser) => {
    if (member.is_ghost_user) {
      return member.ghost_user_email || 'Usuário fictício';
    }
    
    return member.email || 'Email não disponível';
  };

  const getMemberInitials = (member: WorkspaceUser) => {
    const name = getMemberName(member);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isCurrentUser = (member: WorkspaceUser) => {
    return member.user_id === session?.user?.id;
  };

  // isWorkspaceOwner agora vem diretamente do resultado da RPC
  // const isWorkspaceOwner = (member: WorkspaceUser) => {
  //   return member.user_id === workspace.workspace_owner;
  // };

  const canRemoveMember = (member: WorkspaceUser) => {
    // Proprietário não pode ser removido
    if (member.is_owner) return false; // Usar a flag is_owner da RPC
    
    // Só owner e admins podem remover membros
    return workspace.is_owner || workspace.user_role === 'admin';
  };

  const canChangeRole = (member: WorkspaceUser) => {
    // Proprietário não pode ter papel alterado
    if (member.is_owner) return false; // Usar a flag is_owner da RPC
    
    // Usuário não pode alterar seu próprio papel se for o proprietário do workspace (o que não deveria acontecer se is_owner for true)
    // Ou se for o usuário atual e o workspace.is_owner for true (o que significa que ele é o owner e não pode rebaixar a si mesmo)
    if (isCurrentUser(member) && workspace.is_owner) return false;
    
    // Só owner e admins podem alterar papéis
    return workspace.is_owner || workspace.user_role === 'admin';
  };

  const canManageMembers = workspace.is_owner || workspace.user_role === 'admin';
  const canTransferOwnership = workspace.is_owner;

  const getMemberRole = (member: WorkspaceUser) => {
    if (member.is_owner) return 'Proprietário'; // Usar a flag is_owner da RPC
    return member.role === 'admin' ? 'Administrador' : 'Usuário';
  };

  const getMemberBadgeVariant = (member: WorkspaceUser) => {
    if (member.is_owner) return 'default'; // Usar a flag is_owner da RPC
    return member.role === 'admin' ? 'default' : 'outline';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Membros do Núcleo: {workspace.name}
            </DialogTitle>
            <DialogDescription>
              Gerencie os membros que têm acesso a este núcleo financeiro.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {canManageMembers && (
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <p className="text-sm text-muted-foreground">
                  {members.length} {members.length === 1 ? 'membro' : 'membros'}
                </p>
                <div className="flex gap-2">
                  {canTransferOwnership && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowTransferOwnership(true)}
                      size="sm"
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Transferir Propriedade
                    </Button>
                  )}
                  <Button onClick={() => setShowAddMember(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Membro
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  Nenhum membro encontrado
                </p>
                {canManageMembers && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setShowAddMember(true)}
                  >
                    Adicionar Primeiro Membro
                  </Button>
                )}
              </div>
            ) : (
              <>
                {isMobile ? (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <WorkspaceMemberCardMobile
                        key={member.id}
                        member={member}
                        workspace={workspace}
                        onRemoveMember={handleRemoveMember}
                        onChangeRole={handleChangeRole}
                        removingMemberId={removingMemberId}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Membro</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Papel</TableHead>
                          <TableHead>Adicionado em</TableHead>
                          {canManageMembers && <TableHead className="text-right">Ações</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatar_url || undefined} /> {/* Usar avatar_url diretamente */}
                                  <AvatarFallback>
                                    {getMemberInitials(member)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {getMemberName(member)}
                                    {isCurrentUser(member) && (
                                      <span className="ml-2 text-xs text-muted-foreground">(Você)</span>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {getMemberEmail(member)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={member.is_ghost_user ? "secondary" : "default"}>
                                {member.is_ghost_user ? "Fictício" : "Real"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {(member.role === 'admin' || member.is_owner) && ( // Usar is_owner da RPC
                                  <Crown className="h-3 w-3 text-yellow-500" />
                                )}
                                <Badge variant={getMemberBadgeVariant(member)}>
                                  {getMemberRole(member)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            {canManageMembers && (
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {canChangeRole(member) && (
                                      <>
                                        {member.role === 'user' ? (
                                          <DropdownMenuItem
                                            onClick={() => handleChangeRole(member.id, 'admin')}
                                          >
                                            <Crown className="mr-2 h-4 w-4" />
                                            Promover a Admin
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem
                                            onClick={() => handleChangeRole(member.id, 'user')}
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
                                              onClick={() => handleRemoveMember(member.id)}
                                              className="bg-red-600 hover:bg-red-700"
                                              disabled={removingMemberId === member.id}
                                            >
                                              {removingMemberId === member.id ? "Removendo..." : "Remover"}
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}

                                    {!canChangeRole(member) && !canRemoveMember(member) && (
                                      <DropdownMenuItem disabled>
                                        Nenhuma ação disponível
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddMemberModal
        workspace={workspace}
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onMemberAdded={fetchMembers}
      />

      <TransferOwnershipModal
        workspace={workspace}
        members={members.filter(m => !m.is_ghost_user && m.user_id !== workspace.workspace_owner)}
        isOpen={showTransferOwnership}
        onClose={() => setShowTransferOwnership(false)}
        onOwnershipTransferred={() => {
          fetchMembers();
          refreshWorkspaces();
        }}
      />
    </>
  );
};

export default WorkspaceMembersModal;