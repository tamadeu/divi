import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { 
  ArrowLeft, 
  Save, 
  Shield, 
  User as UserIcon, 
  Calendar, 
  Activity,
  Brain,
  Building,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  Globe,
  Edit,
  Eye,
  Trash2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  user_type: string | null;
  ai_provider: string | null;
  updated_at: string | null;
}

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone: string | null;
  profile: UserProfile;
}

interface AIRequestLog {
  id: string;
  input_text: string;
  ai_provider: string;
  ai_model: string | null;
  processing_time_ms: number;
  cost_usd: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  workspace: {
    name: string;
  } | null;
}

interface UserWorkspace {
  id: string;
  name: string;
  description: string | null;
  role: string;
  joined_at: string;
  is_ghost_user: boolean;
  workspace_owner: string;
}

interface SessionLog {
  id: string;
  created_at: string;
  ip: string | null;
  user_agent: string | null;
  provider: string | null;
}

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [aiLogs, setAiLogs] = useState<AIRequestLog[]>([]);
  const [workspaces, setWorkspaces] = useState<UserWorkspace[]>([]);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Form state
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  const fetchUserData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch user basic data
      const { data: userData, error: userError } = await supabase.functions.invoke('admin-list-users', {
        body: { userId }
      });

      if (userError || !userData?.users?.length) {
        showError('Usuário não encontrado');
        navigate('/admin/users');
        return;
      }

      const userInfo = userData.users[0];
      setUser(userInfo);
      setFormData(userInfo.profile || {});

      // Fetch AI request logs
      const { data: aiLogsData, error: aiLogsError } = await supabase
        .from('ai_request_logs')
        .select(`
          id,
          input_text,
          ai_provider,
          ai_model,
          processing_time_ms,
          cost_usd,
          tokens_input,
          tokens_output,
          success,
          error_message,
          created_at,
          workspaces:workspace_id (name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!aiLogsError) {
        setAiLogs(aiLogsData || []);
      }

      // Fetch user workspaces
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspace_users')
        .select(`
          id,
          role,
          joined_at,
          is_ghost_user,
          workspaces:workspace_id (
            id,
            name,
            description,
            workspace_owner
          )
        `)
        .eq('user_id', userId);

      if (!workspacesError && workspacesData) {
        const formattedWorkspaces = workspacesData.map(item => ({
          id: item.workspaces.id,
          name: item.workspaces.name,
          description: item.workspaces.description,
          role: item.role,
          joined_at: item.joined_at,
          is_ghost_user: item.is_ghost_user,
          workspace_owner: item.workspaces.workspace_owner
        }));
        setWorkspaces(formattedWorkspaces);
      }

      // Try to fetch session logs (this might not be available in Supabase auth)
      // We'll simulate this for now since Supabase doesn't expose session history directly
      setSessions([]);

    } catch (error) {
      console.error('Error fetching user data:', error);
      showError('Erro ao carregar dados do usuário');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          user_type: formData.user_type,
          ai_provider: formData.ai_provider,
        })
        .eq('id', user.id);

      if (error) throw error;

      showSuccess('Usuário atualizado com sucesso!');
      setUser({ ...user, profile: { ...user.profile, ...formData } });
      setIsEditing(false);
      
    } catch (error: any) {
      showError('Erro ao atualizar usuário: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6
    }).format(value);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getDisplayName = () => {
    if (!user?.profile) return user?.email?.split('@')[0] || 'Usuário';
    const { first_name, last_name } = user.profile;
    if (first_name && last_name) return `${first_name} ${last_name}`;
    if (first_name) return first_name;
    return user.email?.split('@')[0] || 'Usuário';
  };

  const getInitials = () => {
    if (!user?.profile) return user?.email?.[0]?.toUpperCase() || 'U';
    const { first_name, last_name } = user.profile;
    if (first_name && last_name) return `${first_name[0]}${last_name[0]}`.toUpperCase();
    if (first_name) return first_name[0].toUpperCase();
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  const totalAICost = aiLogs.reduce((sum, log) => sum + (log.cost_usd || 0), 0);
  const successfulAIRequests = aiLogs.filter(log => log.success).length;
  const aiSuccessRate = aiLogs.length > 0 ? (successfulAIRequests / aiLogs.length) * 100 : 0;

  if (loading) {
    return (
      <>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.profile?.avatar_url || ""} alt={getDisplayName()} />
              <AvatarFallback>
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
                {getDisplayName()}
                {user.profile?.user_type === 'admin' ? (
                  <Shield className="h-5 w-5 text-blue-500" />
                ) : (
                  <UserIcon className="h-5 w-5 text-gray-500" />
                )}
                <Badge variant={user.profile?.user_type === 'admin' ? 'default' : 'secondary'}>
                  {user.profile?.user_type === 'admin' ? 'Admin' : 'Usuário'}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="ghost" onClick={() => {
                setFormData(user.profile || {});
                setIsEditing(false);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="ai-logs">Logs de IA</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workspaces.length}</div>
                <p className="text-xs text-muted-foreground">
                  {workspaces.filter(w => w.workspace_owner === user.id).length} como proprietário
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requisições IA</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{aiLogs.length}</div>
                <p className="text-xs text-muted-foreground">
                  {aiSuccessRate.toFixed(1)}% de sucesso
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Total IA</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalAICost)}</div>
                <p className="text-xs text-muted-foreground">
                  Últimas {aiLogs.length} requisições
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Último Acesso</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {formatDate(user.last_sign_in_at)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cadastrado em {formatDate(user.created_at)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <p className="text-sm font-medium">{user.phone || 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Email Confirmado</Label>
                  <Badge variant={user.email_confirmed_at ? "default" : "destructive"}>
                    {user.email_confirmed_at ? 'Confirmado' : 'Não confirmado'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Provedor IA Preferido</Label>
                  <p className="text-sm font-medium">{user.profile?.ai_provider || 'Padrão'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspaces do Usuário</CardTitle>
              <CardDescription>
                Todos os workspaces que o usuário participa ou possui
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workspaces.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workspaces.map((workspace) => (
                        <TableRow key={workspace.id}>
                          <TableCell className="font-medium">{workspace.name}</TableCell>
                          <TableCell>{workspace.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={workspace.workspace_owner === user.id ? "default" : "secondary"}>
                              {workspace.workspace_owner === user.id ? 'Proprietário' : workspace.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(workspace.joined_at)}</TableCell>
                          <TableCell>
                            <Badge variant={workspace.is_ghost_user ? "outline" : "default"}>
                              {workspace.is_ghost_user ? 'Convidado' : 'Ativo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Usuário não participa de nenhum workspace
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Requisições IA</CardTitle>
              <CardDescription>
                Últimas 50 requisições feitas pelo usuário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiLogs.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Provedor</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Workspace</TableHead>
                        <TableHead>Tempo</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aiLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{formatDate(log.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.ai_provider}</Badge>
                          </TableCell>
                          <TableCell>{log.ai_model || '-'}</TableCell>
                          <TableCell>{log.workspace?.name || '-'}</TableCell>
                          <TableCell>{formatDuration(log.processing_time_ms)}</TableCell>
                          <TableCell>{formatCurrency(log.cost_usd)}</TableCell>
                          <TableCell>
                            <Badge variant={log.success ? "default" : "destructive"}>
                              {log.success ? 'Sucesso' : 'Erro'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Usuário ainda não fez requisições para IA
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Sessões</CardTitle>
              <CardDescription>
                Histórico de logins e atividades do usuário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Histórico de sessões não disponível</p>
                <p className="text-sm">O Supabase não expõe dados detalhados de sessão por questões de segurança</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Primeiro Nome</Label>
                  {isEditing ? (
                    <Input
                      id="first_name"
                      value={formData.first_name || ""}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{user.profile?.first_name || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Sobrenome</Label>
                  {isEditing ? (
                    <Input
                      id="last_name"
                      value={formData.last_name || ""}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{user.profile?.last_name || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_type">Tipo de Usuário</Label>
                  {isEditing ? (
                    <select
                      id="user_type"
                      value={formData.user_type || "user"}
                      onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                    </select>
                  ) : (
                    <Badge variant={user.profile?.user_type === 'admin' ? 'default' : 'secondary'}>
                      {user.profile?.user_type === 'admin' ? 'Administrador' : 'Usuário'}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai_provider">Provedor IA Preferido</Label>
                  {isEditing ? (
                    <select
                      id="ai_provider"
                      value={formData.ai_provider || "gemini"}
                      onChange={(e) => setFormData({ ...formData, ai_provider: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="gemini">Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium">{user.profile?.ai_provider || 'gemini'}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Informações do Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ID do Usuário:</span>
                    <p className="text-muted-foreground font-mono">{user.id}</p>
                  </div>
                  <div>
                    <span className="font-medium">Criado em:</span>
                    <p className="text-muted-foreground">{formatDate(user.created_at)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Última atualização:</span>
                    <p className="text-muted-foreground">{formatDate(user.profile?.updated_at)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Último login:</span>
                    <p className="text-muted-foreground">{formatDate(user.last_sign_in_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AdminUserDetail;