import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ThemeOptions } from "@/components/settings/ThemeOptions";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { WorkspaceManagement } from "@/components/settings/WorkspaceManagement";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SettingsPage = () => {
  const location = useLocation();

  useEffect(() => {
    // Verificar se há uma âncora na URL e fazer scroll para ela
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        // Aguardar um pouco para garantir que o elemento foi renderizado
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Configurações</h1>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Atualize suas informações pessoais.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm />
          </CardContent>
        </Card>
        
        <div id="workspace-management">
          <WorkspaceManagement />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeOptions />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Atualize sua senha de acesso.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SettingsPage;