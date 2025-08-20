import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { useAdmin } from '@/hooks/useAdmin';

// Layouts
import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/admin/AdminLayout';

// Auth pages
import Login from '@/pages/Login';

// Main app pages
import Index from '@/pages/Index';
import Transactions from '@/pages/Transactions';
import Accounts from '@/pages/Accounts';
import Categories from '@/pages/Categories';
import Budgets from '@/pages/Budgets';
import Settings from '@/pages/Settings';

// Admin pages
import AdminRoute from '@/components/admin/AdminRoute';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminBanks from '@/pages/admin/AdminBanks';
import AdminCompanies from '@/pages/admin/AdminCompanies';
import AdminSystem from '@/pages/admin/AdminSystem';
import AdminReports from '@/pages/admin/AdminReports';
import AdminSettings from '@/pages/admin/AdminSettings';

// Protected Route Component for regular users
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useSession();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Protected Route Component for admin users
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: sessionLoading } = useSession();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (sessionLoading || adminLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { session, loading } = useSession();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          session ? <Navigate to="/" replace /> : <Login />
        } 
      />

      {/* Admin routes - separate from workspace context */}
      <Route path="/admin" element={
        <AdminProtectedRoute>
          <AdminLayout />
        </AdminProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="banks" element={<AdminBanks />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="system" element={<AdminSystem />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Regular app routes - wrapped with workspace context */}
      <Route path="/*" element={
        <ProtectedRoute>
          <WorkspaceProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="categories" element={<Categories />} />
                <Route path="budgets" element={<Budgets />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </WorkspaceProvider>
        </ProtectedRoute>
      } />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;