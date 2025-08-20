import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlatformSetting } from '@/types/platform-settings';
import { showError } from '@/utils/toast';

export const usePlatformSettings = () => {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('setting_key', { ascending: true });

      if (error) {
        console.error('Error fetching platform settings:', error);
        showError('Erro ao carregar configurações da plataforma');
        return;
      }

      setSettings(data || []);
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      showError('Erro ao carregar configurações da plataforma');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, value: string) => {
    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) {
        console.error('Error updating setting:', error);
        throw error;
      }

      // Update local state
      setSettings(prev => 
        prev.map(setting => 
          setting.setting_key === settingKey 
            ? { ...setting, setting_value: value, updated_at: new Date().toISOString() }
            : setting
        )
      );

      return true;
    } catch (error: any) {
      console.error('Error updating setting:', error);
      showError('Erro ao atualizar configuração: ' + error.message);
      return false;
    }
  };

  const getSetting = (key: string): PlatformSetting | undefined => {
    return settings.find(setting => setting.setting_key === key);
  };

  const getSettingValue = (key: string, defaultValue: string = ''): string => {
    const setting = getSetting(key);
    return setting?.setting_value || defaultValue;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    fetchSettings,
    updateSetting,
    getSetting,
    getSettingValue,
  };
};