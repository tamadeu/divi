import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlatformSetting } from '@/types/platform-settings';

export const usePublicPlatformSettings = () => {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPublicSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('is_public', true);

      if (error) {
        console.error('Error fetching public platform settings:', error);
        return;
      }

      setSettings(data || []);
    } catch (error) {
      console.error('Error in fetchPublicSettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSettingValue = (key: string, defaultValue: string = ''): string => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value || defaultValue;
  };

  const getPlatformName = (): string => {
    return getSettingValue('platform_name', 'Finance Inc');
  };

  const getPlatformTagline = (): string => {
    return getSettingValue('platform_tagline', 'Controle Financeiro Inteligente');
  };

  const getPlatformLogo = (): string => {
    return getSettingValue('platform_logo_url', '');
  };

  const getPlatformFavicon = (): string => {
    return getSettingValue('platform_favicon_url', '');
  };

  const getPrimaryColor = (): string => {
    return getSettingValue('platform_primary_color', '#000000');
  };

  useEffect(() => {
    fetchPublicSettings();

    // Subscribe to changes in platform settings
    const subscription = supabase
      .channel('platform-settings-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'platform_settings',
        filter: 'is_public=eq.true'
      }, fetchPublicSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    settings,
    loading,
    getSettingValue,
    getPlatformName,
    getPlatformTagline,
    getPlatformLogo,
    getPlatformFavicon,
    getPrimaryColor,
  };
};