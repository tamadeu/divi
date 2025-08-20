import { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useProfile } from './useProfile';

export const useAdmin = () => {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !profileLoading) {
      setIsAdmin(profile?.user_type === 'admin');
    }
  }, [profile?.user_type, sessionLoading, profileLoading]);

  return {
    isAdmin,
    loading: sessionLoading || profileLoading
  };
};