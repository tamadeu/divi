import { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useProfile } from './useProfile';

export const useAdmin = () => {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Só atualizar quando ambos não estiverem carregando
    if (!sessionLoading && !profileLoading) {
      const adminStatus = profile?.user_type === 'admin';
      setIsAdmin(adminStatus);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [profile?.user_type, sessionLoading, profileLoading]);

  return {
    isAdmin,
    loading
  };
};