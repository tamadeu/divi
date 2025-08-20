export const updatePageMeta = (
  platformName: string,
  platformFavicon: string,
  platformDescription: string
) => {
  // Update page title only if platform name exists
  if (platformName) {
    document.title = `${platformName} - Controle Financeiro`;
  }

  // Update favicon only if provided
  if (platformFavicon) {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = platformFavicon;
  }

  // Update meta description only if provided
  if (platformDescription) {
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = platformDescription;
  }

  // Update PWA meta tags only if platform name exists
  if (platformName) {
    const appTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
    if (appTitle) {
      appTitle.content = platformName;
    }
  }
};