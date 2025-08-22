"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      // Se não estiver carregando e não houver sessão, redireciona para o login
      navigate('/login');
    }
  }, [session, loading, navigate]);

  if (loading) {
    // Exibe um spinner de carregamento enquanto a sessão está sendo verificada
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se houver sessão, renderiza os filhos da rota
  if (session) {
    return <>{children}</>;
  }

  // Se não houver sessão e não estiver carregando, o useEffect já redirecionou,
  // mas retornamos null para evitar renderização indesejada.
  return null;
};

export default ProtectedRoute;