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
      // Usar a Edge Function para buscar usuários
      const { data, error } = await supabase.functions.invoke('admin-list-users');

      if (error) {
        console.error('Error calling admin-list-users function:', error);
        showError('Erro ao carregar usuários: ' + error.message);
        return;
      }

      if (data.error) {
        showError(data.error);
        return;
      }

      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
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