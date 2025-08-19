import { ProfileForm } from "@/components/settings/ProfileForm";
import { ThemeOptions } from "@/components/settings/ThemeOptions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SettingsPage = () => {
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
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeOptions />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SettingsPage;