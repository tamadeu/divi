import { useProfile as useProfileContext } from '@/contexts/ProfileContext';
import { Profile } from '@/types/profile'; // Import the Profile interface

export const useProfile = () => {
  const { profile, loading, refreshProfile } = useProfileContext();
  return { profile, loading, refreshProfile };
};