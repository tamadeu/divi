import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-32 h-8" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;