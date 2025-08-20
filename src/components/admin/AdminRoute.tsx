import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/contexts/SessionContext';
import { useProfile } from '@/hooks/useProfile';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Debug logs
  console.log('AdminRoute Debug:', {
    sessionLoading,
    profileLoading,
    adminLoading,
    session: !!session,
    profile,
    isAdmin
  });

  // Se ainda está carregando qualquer coisa
  if (sessionLoading || profileLoading || adminLoading) {
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
    console.log('AdminRoute: No session, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Se não é admin
  if (!isAdmin) {
    console.log('AdminRoute: User is not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('AdminRoute: User is admin, rendering children');
  return <>{children}</>;
};

export default AdminRoute;