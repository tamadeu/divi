import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Index from "./pages/Index"; // Import the new Index page
import { Toaster } from "@/components/ui/toaster";
import { ModalProvider } from "./contexts/ModalContext";
import { SessionProvider } from "./contexts/SessionContext";
import Login from "./pages/Login";
import PrivateRoute from "./components/auth/PrivateRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import Accounts from "./pages/Accounts";
import Categories from "./pages/Categories";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SearchResults from "./pages/SearchResults";
import AdminDashboard from "./pages/AdminDashboard";
import Banks from "./pages/Banks";
import Companies from "./pages/Companies";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <SessionProvider>
        <ModalProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} /> {/* Set Index as the default route */}
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="search" element={<SearchResults />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="admin/banks" element={<Banks />} />
                  <Route path="admin/companies" element={<Companies />} />
                </Route>
              </Route>
            </Routes>
          </Router>
          <Toaster />
        </ModalProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;