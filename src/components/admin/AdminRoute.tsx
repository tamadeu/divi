import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/contexts/SessionContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { session, loading: sessionLoading } = useSession();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Se ainda está carregando qualquer coisa
  if (sessionLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Skeleton className="w-32 h-8 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Verificando permissões de administrador...
          </p>
        </div>
      </div>
    );
  }

  // Se não tem sessão
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se não é admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;