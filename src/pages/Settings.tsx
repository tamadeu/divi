import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProfileSettings from "@/components/settings/ProfileSettings";
import AIProviderSettings from "@/components/settings/AIProviderSettings";
import { ThemeToggle } from "@/components/settings/ThemeToggle";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie suas informações pessoais e preferências.
        </p>
      </div>
      <Separator />
      
      <div className="grid gap-6">
        <ProfileSettings />
        
        <AIProviderSettings />
        
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>
              Personalize a aparência da aplicação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;