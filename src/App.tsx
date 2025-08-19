import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider, useSession } from "@/contexts/SessionContext";
import { ModalProvider } from "@/contexts/ModalContext";
import Layout from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import AccountsPage from "./pages/Accounts";
import AccountDetailPage from "./pages/AccountDetail";
import TransactionsPage from "./pages/Transactions";
import SearchResultsPage from "./pages/SearchResults";
import BudgetsPage from "./pages/Budgets";
import ReportsPage from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import CategoriesPage from "./pages/Categories";
import { Skeleton } from "./components/ui/skeleton";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";

const ProtectedRoute = () => {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-32 h-8" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/:accountId" element={<AccountDetailPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
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
        <ModalProvider>
          <AppRoutes />
        </ModalProvider>
      </SessionProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;