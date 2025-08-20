import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/database";
import { Shield, User as UserIcon, Eye, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface UsersTableProps {
  users: User[];
  onChangeUserType: (userId: string, newType: "admin" | "user") => void;
  loading?: boolean;
}

const UsersTable = ({ users, onChangeUserType, loading }: UsersTableProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getDisplayName = (user: User) => {
    if (user.profile?.first_name && user.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    if (user.profile?.first_name) {
      return user.profile.first_name;
    }
    return user.email.split('@')[0];
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data de Cadastro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {user.profile?.user_type === 'admin' ? (
                      <Shield className="h-4 w-4 text-blue-500" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-gray-500" />
                    )}
                    <Link 
                      to={`/admin/users/${user.id}`}
                      className="hover:underline flex items-center gap-1"
                    >
                      {getDisplayName(user)}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.profile?.user_type === 'admin' ? 'default' : 'secondary'}>
                    {user.profile?.user_type === 'admin' ? 'Admin' : 'Usuário'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      asChild
                      disabled={loading}
                    >
                      <Link to={`/admin/users/${user.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => 
                        onChangeUserType(
                          user.id, 
                          user.profile?.user_type === 'admin' ? 'user' : 'admin'
                        )
                      }
                      disabled={loading}
                    >
                      {user.profile?.user_type === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTable;