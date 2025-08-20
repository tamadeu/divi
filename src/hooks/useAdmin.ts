import { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useProfile } from './useProfile';

export const useAdmin = () => {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log('useAdmin effect:', {
      sessionLoading,
      profileLoading,
      profile,
      userType: profile?.user_type
    });

    if (!sessionLoading && !profileLoading) {
      const adminStatus = profile?.user_type === 'admin';
      console.log('useAdmin: Setting admin status to:', adminStatus);
      setIsAdmin(adminStatus);
    }
  }, [profile?.user_type, sessionLoading, profileLoading]);

  return {
    isAdmin,
    loading: sessionLoading || profileLoading
  };
};