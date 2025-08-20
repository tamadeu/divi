"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import IndexPage from './pages/Index'; // Assumindo que você tem uma página inicial
import TransactionsPage from './pages/Transactions'; // Exemplo de página
import AccountsPage from './pages/Accounts'; // Exemplo de página
import CategoriesPage from './pages/Categories'; // Exemplo de página
import BudgetsPage from './pages/Budgets'; // Exemplo de página
import ReportsPage from './pages/Reports'; // Exemplo de página
import SettingsPage from './pages/Settings'; // Exemplo de página
import LoginPage from './pages/Login'; // Assumindo que você tem uma página de login
import { SessionProvider } from './contexts/SessionContext'; // Assumindo que você tem um SessionProvider

function App() {
  return (
    <Router>
      <SessionProvider> {/* Envolva seu aplicativo com o SessionProvider */}
        <Routes>
          {/* Rotas públicas ou de autenticação */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rotas protegidas que usam o layout principal */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<IndexPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            {/* Adicione outras rotas aqui */}
          </Route>
        </Routes>
      </SessionProvider>
    </Router>
  );
}

export default App;