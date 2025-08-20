import { useEffect } from 'react';
import { usePublicPlatformSettings } from '@/hooks/usePublicPlatformSettings';
import { updatePageMeta } from '@/utils/updatePageMeta';

const PlatformMetaUpdater = () => {
  const { 
    getPlatformName, 
    getPlatformFavicon, 
    getSettingValue,
    loading 
  } = usePublicPlatformSettings();

  useEffect(() => {
    if (!loading) {
      const platformName = getPlatformName();
      const platformFavicon = getPlatformFavicon();
      const platformDescription = getSettingValue('platform_description', 'Aplicativo de controle financeiro pessoal');

      updatePageMeta(platformName, platformFavicon, platformDescription);
    }
  }, [loading, getPlatformName, getPlatformFavicon, getSettingValue]);

  return null; // This component doesn't render anything
};

export default PlatformMetaUpdater;