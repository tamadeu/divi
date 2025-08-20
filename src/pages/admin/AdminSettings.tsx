import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { PlatformSettingsGroup } from "@/types/platform-settings";
import SettingsGroup from "@/components/admin/settings/SettingsGroup";
import { 
  Palette, 
  Building2, 
  Phone, 
  Share2, 
  Settings as SettingsIcon, 
  Zap 
} from "lucide-react";

const AdminSettings = () => {
  const { settings, loading, updateSetting } = usePlatformSettings();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'branding':
        return <Palette className="h-5 w-5" />;
      case 'contact':
        return <Phone className="h-5 w-5" />;
      case 'social':
        return <Share2 className="h-5 w-5" />;
      case 'system':
        return <SettingsIcon className="h-5 w-5" />;
      case 'features':
        return <Zap className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'branding':
        return {
          title: 'Identidade Visual',
          description: 'Configure o nome, logo, cores e elementos visuais da plataforma'
        };
      case 'contact':
        return {
          title: 'Informações de Contato',
          description: 'Dados de contato da empresa e suporte'
        };
      case 'social':
        return {
          title: 'Redes Sociais',
          description: 'Links para redes sociais e site oficial'
        };
      case 'system':
        return {
          title: 'Configurações do Sistema',
          description: 'Configurações técnicas e de funcionamento da plataforma'
        };
      case 'features':
        return {
          title: 'Funcionalidades',
          description: 'Habilitar ou desabilitar recursos da plataforma'
        };
      default:
        return {
          title: 'Configurações Gerais',
          description: 'Outras configurações da plataforma'
        };
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Configurações da Plataforma</h1>
        </div>
        <div className="grid gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </>
    );
  }

  // Group settings by category
  const groupedSettings: PlatformSettingsGroup[] = [];
  const categories = [...new Set(settings.map(s => s.category))];

  categories.forEach(category => {
    const categorySettings = settings.filter(s => s.category === category);
    const categoryInfo = getCategoryInfo(category);
    
    groupedSettings.push({
      category,
      title: categoryInfo.title,
      description: categoryInfo.description,
      settings: categorySettings
    });
  });

  // Sort groups by priority
  const sortOrder = ['branding', 'contact', 'social', 'features', 'system'];
  groupedSettings.sort((a, b) => {
    const aIndex = sortOrder.indexOf(a.category);
    const bIndex = sortOrder.indexOf(b.category);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Configurações da Plataforma</h1>
      </div>

      <div className="grid gap-6">
        {groupedSettings.map((group) => (
          <SettingsGroup
            key={group.category}
            group={group}
            onUpdateSetting={updateSetting}
          />
        ))}
      </div>
    </>
  );
};

export default AdminSettings;