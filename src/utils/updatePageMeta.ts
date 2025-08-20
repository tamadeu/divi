import { usePublicPlatformSettings } from '@/hooks/usePublicPlatformSettings';

export const updatePageMeta = (
  platformName: string,
  platformFavicon: string,
  platformDescription: string
) => {
  // Update page title
  document.title = `${platformName} - Controle Financeiro`;

  // Update favicon
  if (platformFavicon) {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = platformFavicon;
  }

  // Update meta description
  let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    document.head.appendChild(metaDescription);
  }
  metaDescription.content = platformDescription || 'Aplicativo de controle financeiro pessoal';

  // Update PWA meta tags
  const appTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
  if (appTitle) {
    appTitle.content = platformName;
  }
};