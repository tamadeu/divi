import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider, useSession } from "@/contexts/SessionContext";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext"; // Import ProfileProvider and useProfile
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ModalProvider } from "@/contexts/ModalContext";
import Layout from "@/components/layout/Layout";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminRoute from "@/components/admin/AdminRoute";
import PlatformMetaUpdater from "@/components/PlatformMetaUpdater";
import Dashboard from "./pages/Dashboard";
import AccountsPage from "./pages/Accounts";
import AccountDetailPage from "./pages/AccountDetail";
import TransactionsPage from "./pages/Transactions";
import SearchResultsPage from "./pages/SearchResults";
import BudgetsPage from "./pages/Budgets";
import ReportsPage from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import CreditCardsPage from "./pages/CreditCards";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminPlanDetail from "./pages/admin/AdminPlanDetail";
import AdminBanks from "./pages/admin/AdminBanks";
import AdminCompanies from "./pages/admin/AdminCompanies";
import AdminSystem from "./pages/admin/AdminSystem";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import CategoriesPage from "./pages/Categories";
import { Skeleton } from "./components/ui/skeleton";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import ConfirmImportPage from "./pages/ConfirmImportPage"; // Import the new page
import TransactionDetailEditPage from "./pages/TransactionDetailEditPage"; // Import the new page

const ProtectedRoute = () => {
  const { session, loading: sessionLoading } = useSession();
  const { loading: profileLoading } = useProfile(); // Use profile loading state

  if (sessionLoading || profileLoading) { // Wait for both session and profile to load
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-32 h-8" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <WorkspaceProvider>
      <Layout />
    </WorkspaceProvider>
  );
};

const AdminProtectedRoute = () => {
  const { session, loading: sessionLoading } = useSession();
  const { loading: profileLoading } = useProfile(); // Use profile loading state

  if (sessionLoading || profileLoading) { // Wait for both session and profile to load
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-32 h-8" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  );
};

function AppRoutes() {
  return (
    <Router>
      <PlatformMetaUpdater />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Main App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/:accountId" element={<AccountDetailPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/:transactionId" element={<TransactionDetailEditPage />} /> {/* New route */}
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/credit-cards" element={<CreditCardsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/confirm-import" element={<ConfirmImportPage />} /> {/* New route for CSV import confirmation */}
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminProtectedRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:userId" element={<AdminUserDetail />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="plans/:planId" element={<AdminPlanDetail />} />
          <Route path="banks" element={<AdminBanks />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="system" element={<AdminSystem />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <ProfileProvider> {/* Wrap with ProfileProvider */}
          <ModalProvider>
            <AppRoutes />
          </ModalProvider>
        </ProfileProvider>
      </SessionProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;