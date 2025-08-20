"use client";

import { useState, useEffect } from "react";
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
import { MoreHorizontal, Plus, User, UserX, Crown, Shield } from "lucide-react";
import { WorkspaceWithRole, WorkspaceUser } from "@/types/workspace";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import AddMemberModal from "./AddMemberModal";
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

interface WorkspaceMembersModalProps {
  workspace: WorkspaceWithRole;
  isOpen: boolean;
  onClose: () => void;
}

const WorkspaceMembersModal = ({ workspace, isOpen, onClose }: WorkspaceMembersModalProps) => {
  const [members, setMembers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!workspace.id) return;

    setLoading(true);
    try {
      // Primeiro, buscar todos os workspace_users
      const { data: workspaceUsers, error: usersError } = await supabase
        .from('workspace_users')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('joined_at', { ascending: true });

      if (usersError) throw usersError;

      // Depois, para cada usuário real, buscar o perfil
      const membersWithProfiles = [];
      
      for (const user of workspaceUsers || []) {
        if (user.is_ghost_user || !user.user_id) {
          // Usuário fantasma - adicionar diretamente
          membersWithProfiles.push({
            ...user,
            profile: null
          });
        } else {
          // Usuário real - buscar perfil
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', user.user_id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile for user:', user.user_id, profileError);
          }

          membersWithProfiles.push({
            ...user,
            profile: profile || null
          });
        }
      }

      setMembers(membersWithProfiles);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      showError('Erro ao carregar membros do núcleo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && workspace.id) {
      fetchMembers();
    }
  }, [isOpen, workspace.id]);

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
    } catch (error: any) {
      console.error('Error removing member:', error);
      showError('Erro ao remover membro');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('workspace_users')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      showSuccess('Papel do membro atualizado com sucesso!');
      await fetchMembers();
    } catch (error: any) {
      console.error('Error changing member role:', error);
      showError('Erro ao alterar papel do membro');
    }
  };

  const getMemberName = (member: WorkspaceUser) => {
    if (member.is_ghost_user) {
      return member.ghost_user_name || 'Usuário Fantasma';
    }
    
    if (member.profile?.first_name || member.profile?.last_name) {
      return `${member.profile.first_name || ''} ${member.profile.last_name || ''}`.trim();
    }
    
    return 'Usuário';
  };

  const getMemberEmail = (member: WorkspaceUser) => {
    if (member.is_ghost_user) {
      return member.ghost_user_email || 'Usuário fictício';
    }
    
    return 'Email não disponível';
  };

  const getMemberInitials = (member: WorkspaceUser) => {
    const name = getMemberName(member);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const canManageMembers = workspace.is_owner || workspace.user_role === 'admin';

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
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {members.length} {members.length === 1 ? 'membro' : 'membros'}
                </p>
                <Button onClick={() => setShowAddMember(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Membro
                </Button>
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
              <div className="rounded-md border">
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
                              <AvatarImage src={member.profile?.avatar_url} />
                              <AvatarFallback>
                                {getMemberInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {getMemberName(member)}
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
                            {member.role === 'admin' && <Crown className="h-3 w-3 text-yellow-500" />}
                            <Badge variant={member.role === 'admin' ? "default" : "outline"}>
                              {member.role === 'admin' ? 'Administrador' : 'Usuário'}
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
          </div>
        </DialogContent>
      </Dialog>

      <AddMemberModal
        workspace={workspace}
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onMemberAdded={fetchMembers}
      />
    </>
  );
};

export default WorkspaceMembersModal;