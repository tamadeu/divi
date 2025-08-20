import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import UsersTable from "@/components/admin/UsersTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
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
        return;
      }

      // Buscar dados de autenticação dos usuários
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
      setFilteredUsers(combinedUsers);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      showError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filtrar por busca
    if (searchQuery) {
      filtered = filtered.filter(user => {
        const name = `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.toLowerCase();
        const email = user.email.toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
      });
    }

    // Filtrar por tipo
    if (userTypeFilter !== "all") {
      filtered = filtered.filter(user => user.profile?.user_type === userTypeFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, userTypeFilter]);

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
    }
  };

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Gerenciar Usuários</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários da Plataforma</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários cadastrados na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <UsersTable 
              users={filteredUsers} 
              onChangeUserType={handleChangeUserType}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AdminUsers;