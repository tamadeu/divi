import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AccountsPage from "./pages/Accounts";
import AccountDetailPage from "./pages/AccountDetail";
import TransactionsPage from "./pages/Transactions";
import SearchResultsPage from "./pages/SearchResults";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/accounts/:accountId" element={<AccountDetailPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;