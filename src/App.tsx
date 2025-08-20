import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { ModalProvider } from '@/contexts/ModalContext';

// Layout components
import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/admin/AdminRoute';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Transactions from '@/pages/Transactions';
import Accounts from '@/pages/Accounts';
import Categories from '@/pages/Categories';
import Budget from '@/pages/Budgets';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCompanies from '@/pages/admin/AdminCompanies';
import AdminBanks from '@/pages/admin/AdminBanks';
import AdminSystem from '@/pages/admin/AdminSystem';
import AdminReports from '@/pages/admin/AdminReports';
import AdminSettings from '@/pages/admin/AdminSettings';

function App() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <ModalProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="companies" element={<AdminCompanies />} />
                <Route path="banks" element={<AdminBanks />} />
                <Route path="system" element={<AdminSystem />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              
              {/* Main app routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="categories" element={<Categories />} />
                <Route path="budget" element={<Budget />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </ModalProvider>
    </SessionContextProvider>
  );
}

export default App;