import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Database, Settings, TrendingUp, Activity } from "lucide-react";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    totalTransactions: 0,
    totalAccounts: 0,
    totalCategories: 0,
    recentSignups: 0,
  });

  const fetchStats = async () => {
    setLoading(true);
    
    try {
      // Buscar usuários via Edge Function
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-list-users');
      
      let totalUsers = 0;
      let adminUsers = 0;
      let recentSignups = 0;

      if (!usersError && usersData?.users) {
        totalUsers = usersData.users.length;
        adminUsers = usersData.users.filter((u: any) => u.profile?.user_type === 'admin').length;
        
        // Usuários cadastrados nos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        recentSignups = usersData.users.filter((u: any) => 
          new Date(u.created_at) > sevenDaysAgo
        ).length;
      }

      // Buscar contadores de outras tabelas
      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      const { count: accountsCount } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true });

      const { count: categoriesCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers,
        adminUsers,
        totalTransactions: transactionsCount || 0,
        totalAccounts: accountsCount || 0,
        totalCategories: categoriesCount || 0,
        recentSignups,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <>
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Dashboard Administrativo</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard Administrativo</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentSignups} novos nos últimos 7 dias
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? ((stats.adminUsers / stats.totalUsers) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Média de {stats.totalUsers > 0 ? (stats.totalTransactions / stats.totalUsers).toFixed(1) : 0} por usuário
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Média de {stats.totalUsers > 0 ? (stats.totalAccounts / stats.totalUsers).toFixed(1) : 0} por usuário
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias Criadas</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Personalizações dos usuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.recentSignups}</div>
            <p className="text-xs text-muted-foreground">
              Novos usuários esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidade de atividade recente será implementada aqui.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Banco de Dados</span>
                <span className="text-sm text-green-600">✓ Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API</span>
                <span className="text-sm text-green-600">✓ Funcionando</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Autenticação</span>
                <span className="text-sm text-green-600">✓ Ativo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminDashboard;