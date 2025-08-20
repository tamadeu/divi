import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Transactions from "@/pages/Transactions";
import Accounts from "@/pages/Accounts";
import Categories from "@/pages/Categories";
import Budgets from "@/pages/Budgets";
import CreditCards from "@/pages/CreditCards";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Workspaces from "@/pages/Workspaces";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <ModalProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="credit-cards" element={<CreditCards />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="workspaces" element={<Workspaces />} />
                </Route>
              </Routes>
            </Router>
            <Toaster />
          </ModalProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;