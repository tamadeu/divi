import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import UsersTable from "@/components/admin/UsersTable";
import { Users, Shield, Database, Settings } from "lucide-react";

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    totalTransactions: 0,
    totalAccounts: 0,
  });

  const fetchUsers = async () => {
    setLoading(true);
    
    // Buscar usuários com perfis
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        user_type,
        updated_at
      `);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      showError('Erro ao carregar usuários');
      setLoading(false);
      return;
    }

    // Buscar dados de autenticação dos usuários
    const userIds = usersData.map(profile => profile.id);
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      // Continuar mesmo com erro de auth, usando apenas dados do perfil
    }

    // Combinar dados
    const combinedUsers: User[] = usersData.map(profile => {
      const authUser = authUsers?.users.find(u => u.id === profile.id);
      return {
        id: profile.id,
        email: authUser?.email || 'Email não disponível',
        created_at: authUser?.created_at || profile.updated_at,
        profile: {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: null,
          updated_at: profile.updated_at,
          user_type: profile.user_type as "admin" | "user",
        }
      };
    });

    setUsers(combinedUsers);
    setLoading(false);
  };

  const fetchStats = async () => {
    // Buscar estatísticas
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_type');

    const { count: transactionsCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    const { count: accountsCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });

    const totalUsers = profilesData?.length || 0;
    const adminUsers = profilesData?.filter(p => p.user_type === 'admin').length || 0;

    setStats({
      totalUsers,
      adminUsers,
      totalTransactions: transactionsCount || 0,
      totalAccounts: accountsCount || 0,
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const handleChangeUserType = async (userId: string, newType: "admin" | "user") => {
    const { error } = await supabase
      .from('profiles')
      .update({ user_type: newType })
      .eq('id', userId);

    if (error) {
      showError('Erro ao alterar tipo de usuário: ' + error.message);
    } else {
      showSuccess(`Usuário ${newType === 'admin' ? 'promovido a admin' : 'removido de admin'} com sucesso!`);
      fetchUsers();
      fetchStats();
    }
  };

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Administração</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccounts}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os usuários da plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <UsersTable 
                  users={users} 
                  onChangeUserType={handleChangeUserType}
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Plataforma</CardTitle>
              <CardDescription>
                Configurações gerais da aplicação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidades de configuração serão implementadas aqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AdminPage;