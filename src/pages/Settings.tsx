import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Plus, Users, Trash2, LogOut, MoreVertical, Moon, Sun, Monitor, Key } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WorkspaceMembersModal from "@/components/settings/WorkspaceMembersModal";
import { WorkspaceWithRole } from "@/types/workspace";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  is_shared: boolean;
  created_at: string;
  workspace_owner: string;
  user_role?: string;
}

const Settings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { refreshWorkspaces } = useWorkspace();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [managingMembersWorkspace, setManagingMembersWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [leavingWorkspace, setLeavingWorkspace] = useState<Workspace | null>(null);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    type: "personal",
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchWorkspaces();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || "");
      setCurrentUserId(user.id);
      
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(profileData);
      }
    }
    setLoading(false);
  };

  const fetchWorkspaces = async () => {
    setLoadingWorkspaces(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar workspaces onde o usuário é owner
    const { data: ownedWorkspaces, error: ownedError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("workspace_owner", user.id);

    // Buscar workspaces onde o usuário é membro (mas não owner)
    const { data: memberWorkspaces, error: memberError } = await supabase
      .from("workspace_users")
      .select(`
        role,
        workspaces!inner (
          id,
          name,
          description,
          is_shared,
          created_at,
          workspace_owner
        )
      `)
      .eq("user_id", user.id)
      .neq("workspaces.workspace_owner", user.id);

    if (ownedError || memberError) {
      console.error("Error fetching workspaces:", ownedError || memberError);
      showError("Erro ao carregar núcleos financeiros");
      setLoadingWorkspaces(false);
      return;
    }

    // Combinar e formatar os dados
    const allWorkspaces: Workspace[] = [];

    // Adicionar workspaces próprios
    if (ownedWorkspaces) {
      ownedWorkspaces.forEach(workspace => {
        allWorkspaces.push({
          ...workspace,
          user_role: "owner"
        });
      });
    }

    // Adicionar workspaces onde é membro (mas não owner)
    if (memberWorkspaces) {
      memberWorkspaces.forEach(item => {
        if (item.workspaces) {
          allWorkspaces.push({
            ...item.workspaces,
            user_role: item.role
          });
        }
      });
    }

    setWorkspaces(allWorkspaces);
    setLoadingWorkspaces(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Usuário não autenticado");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        avatar_url: profile?.avatar_url,
      })
      .eq("id", user.id);

    if (error) {
      showError("Erro ao salvar perfil");
      console.error("Error updating profile:", error);
    } else {
      showSuccess("Perfil atualizado com sucesso!");
    }

    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      showError("As senhas não coincidem");
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      showError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: passwordFormData.newPassword
    });

    if (error) {
      showError("Erro ao alterar senha");
      console.error("Error changing password:", error);
    } else {
      showSuccess("Senha alterada com sucesso!");
      setIsPasswordModalOpen(false);
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }

    setChangingPassword(false);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingWorkspace(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Usuário não autenticado");
      setCreatingWorkspace(false);
      return;
    }

    const { error } = await supabase
      .from("workspaces")
      .insert({
        name: createFormData.name,
        description: createFormData.description,
        created_by: user.id,
        workspace_owner: user.id,
        is_shared: createFormData.type === "shared",
      });

    if (error) {
      showError("Erro ao criar núcleo financeiro");
      console.error("Error creating workspace:", error);
    } else {
      showSuccess("Núcleo financeiro criado com sucesso!");
      setIsCreateModalOpen(false);
      setCreateFormData({ name: "", description: "", type: "personal" });
      fetchWorkspaces();
      refreshWorkspaces();
    }

    setCreatingWorkspace(false);
  };

  const handleManageMembers = (workspace: Workspace) => {
    // Converter para WorkspaceWithRole
    const workspaceWithRole: WorkspaceWithRole = {
      ...workspace,
      created_by: workspace.workspace_owner,
      updated_at: workspace.created_at,
      user_role: workspace.user_role as 'owner' | 'admin' | 'user',
      is_owner: workspace.user_role === 'owner'
    };
    setManagingMembersWorkspace(workspaceWithRole);
  };

  const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o núcleo "${workspaceName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);

    if (error) {
      showError("Erro ao excluir núcleo financeiro");
      console.error("Error deleting workspace:", error);
    } else {
      showSuccess("Núcleo financeiro excluído com sucesso!");
      fetchWorkspaces();
      refreshWorkspaces();
    }
  };

  const confirmLeaveWorkspace = async () => {
    if (!leavingWorkspace) return;

    const { error } = await supabase
      .from("workspace_users")
      .delete()
      .eq("workspace_id", leavingWorkspace.id)
      .eq("user_id", currentUserId);

    if (error) {
      showError("Erro ao deixar núcleo financeiro");
      console.error("Error leaving workspace:", error);
    } else {
      showSuccess("Você saiu do núcleo financeiro!");
      fetchWorkspaces();
      refreshWorkspaces();
    }

    setLeavingWorkspace(null);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Proprietário";
      case "admin":
        return "Administrador";
      case "user":
        return "Membro";
      default:
        return "Membro";
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "user":
        return "outline";
      default:
        return "outline";
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  // Função para verificar se pode gerenciar membros
  const canManageMembers = (workspace: Workspace) => {
    return workspace.is_shared && (workspace.user_role === "owner" || workspace.user_role === "admin");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências.
          </p>
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências.
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Atualize suas informações pessoais e foto de perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ""} alt="Avatar" />
                <AvatarFallback className="text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar_url">URL do Avatar</Label>
                <Input
                  id="avatar_url"
                  value={profile?.avatar_url || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, avatar_url: e.target.value } : null)}
                  placeholder="https://exemplo.com/avatar.jpg"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nome</Label>
                <Input
                  id="first_name"
                  value={profile?.first_name || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input
                  id="last_name"
                  value={profile?.last_name || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O email não pode ser alterado.
              </p>
            </div>
            
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Workspaces Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Núcleos Financeiros</CardTitle>
              <CardDescription>
                Gerencie seus núcleos financeiros e permissões.
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Núcleo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingWorkspaces ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{workspace.name}</h3>
                      <Badge variant={workspace.is_shared ? "default" : "secondary"}>
                        {workspace.is_shared ? "Compartilhado" : "Pessoal"}
                      </Badge>
                      <Badge variant={getRoleBadgeVariant(workspace.user_role || "user")}>
                        {getRoleLabel(workspace.user_role || "user")}
                      </Badge>
                    </div>
                    {workspace.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {workspace.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado: {new Date(workspace.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Só mostrar "Gerenciar Usuários" se for workspace compartilhado */}
                      {canManageMembers(workspace) && (
                        <DropdownMenuItem onClick={() => handleManageMembers(workspace)}>
                          <Users className="h-4 w-4 mr-2" />
                          Gerenciar Usuários
                        </DropdownMenuItem>
                      )}
                      {workspace.user_role === "owner" ? (
                        <DropdownMenuItem
                          onClick={() => handleDeleteWorkspace(workspace.id, workspace.name)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Núcleo
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setLeavingWorkspace(workspace)}
                          className="text-red-600"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Deixar Núcleo
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              
              {workspaces.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum núcleo financeiro encontrado.</p>
                  <p className="text-sm">Crie seu primeiro núcleo para começar!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Gerencie sua senha e configurações de segurança.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsPasswordModalOpen(true)}>
            <Key className="h-4 w-4 mr-2" />
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* Create Workspace Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Núcleo Financeiro</DialogTitle>
            <DialogDescription>
              Crie um novo núcleo para organizar suas finanças.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWorkspace}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Núcleo</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="Ex: Família, Empresa, Pessoal..."
                  autoFocus={false}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="Descreva o propósito deste núcleo..."
                  autoFocus={false}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={createFormData.type}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Pessoal</SelectItem>
                    <SelectItem value="shared">Compartilhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creatingWorkspace || !createFormData.name}>
                {creatingWorkspace ? "Criando..." : "Criar Núcleo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite sua nova senha. Ela deve ter pelo menos 6 caracteres.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  placeholder="Digite sua nova senha"
                  autoFocus={false}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  placeholder="Confirme sua nova senha"
                  autoFocus={false}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={changingPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword}>
                {changingPassword ? "Alterando..." : "Alterar Senha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Leave Workspace Alert Dialog */}
      <AlertDialog open={!!leavingWorkspace} onOpenChange={() => setLeavingWorkspace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deixar Núcleo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deixar o núcleo "{leavingWorkspace?.name}"?
              Você perderá acesso a todas as informações financeiras deste núcleo.
              Para voltar, será necessário ser convidado novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeaveWorkspace}
              className="bg-red-600 hover:bg-red-700"
            >
              Deixar Núcleo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Workspace Members Modal */}
      {managingMembersWorkspace && (
        <WorkspaceMembersModal
          workspace={managingMembersWorkspace}
          isOpen={!!managingMembersWorkspace}
          onClose={() => setManagingMembersWorkspace(null)}
        />
      )}
    </div>
  );
};

export default Settings;