import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/contexts/SessionContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Accounts from "@/pages/Accounts";
import Categories from "@/pages/Categories";
import Transactions from "@/pages/Transactions";
import Reports from "@/pages/Reports";
import Budgets from "@/pages/Budgets";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import AccountDetail from "@/pages/AccountDetail";
import SearchResults from "@/pages/SearchResults";
import Workspaces from "@/pages/Workspaces";
import WorkspaceSettings from "@/pages/WorkspaceSettings";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminSettings from "@/pages/AdminSettings";
import AdminSubscriptionPlans from "@/pages/AdminSubscriptionPlans";
import AdminCompanies from "@/pages/AdminCompanies";
import AdminBanks from "@/pages/AdminBanks";
import TransactionDetailsPage from "@/pages/TransactionDetailsPage"; // Import the new page

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <ProfileProvider>
          <WorkspaceProvider>
            <ModalProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Index />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="accounts/:accountId" element={<AccountDetail />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="transactions/:transactionId" element={<TransactionDetailsPage />} /> {/* New Route */}
                  <Route path="reports" element={<Reports />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="search" element={<SearchResults />} />
                  <Route path="workspaces" element={<Workspaces />} />
                  <Route path="workspaces/:workspaceId/settings" element={<WorkspaceSettings />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="admin/users" element={<AdminUsers />} />
                  <Route path="admin/settings" element={<AdminSettings />} />
                  <Route path="admin/subscription-plans" element={<AdminSubscriptionPlans />} />
                  <Route path="admin/companies" element={<AdminCompanies />} />
                  <Route path="admin/banks" element={<AdminBanks />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </ModalProvider>
          </WorkspaceProvider>
        </ProfileProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;