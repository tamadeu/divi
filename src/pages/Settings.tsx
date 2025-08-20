import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/contexts/SessionContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { 
  User, 
  Mail, 
  Shield, 
  Palette, 
  Bell, 
  Lock, 
  Download,
  Trash2,
  LogOut,
  Brain
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Settings = () => {
  const { session } = useSession();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [aiProvider, setAiProvider] = useState(profile?.ai_provider || "gemini");

  const handleUpdateProfile = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          first_name: firstName,
          last_name: lastName,
          ai_provider: aiProvider,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      showSuccess('Perfil atualizado com sucesso!');
    } catch (error: any) {
      showError('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    return session?.user?.email?.split('@')[0] || 'Usuário';
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.first_name) {
      return profile.first_name[0].toUpperCase();
    }
    return session?.user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie sua conta e preferências da aplicação.
        </p>
      </div>
      <Separator />
      
      {/* Perfil do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>
            Suas informações pessoais e configurações de conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || ""} alt={getDisplayName()} />
              <AvatarFallback className="text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-lg font-medium">{getDisplayName()}</h4>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {session?.user?.email}
              </p>
              {profile?.user_type === 'admin' && (
                <Badge variant="default" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Administrador
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Seu sobrenome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aiProvider" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Provedor de IA Preferido
            </Label>
            <Select value={aiProvider} onValueChange={setAiProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o provedor de IA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI GPT</SelectItem>
                <SelectItem value="anthropic">Anthropic Claude</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Este provedor será usado para análise de transações e outras funcionalidades de IA.
            </p>
          </div>

          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência da aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como você deseja receber notificações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configurações de notificação serão implementadas em breve.
          </p>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Gerencie a segurança da sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" disabled>
            Alterar Senha
          </Button>
          <p className="text-xs text-muted-foreground">
            Funcionalidade de alteração de senha será implementada em breve.
          </p>
        </CardContent>
      </Card>

      {/* Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Seus Dados
          </CardTitle>
          <CardDescription>
            Exporte ou exclua seus dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente sua
                  conta e removerá seus dados de nossos servidores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir Conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Sair */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Sair da Conta
          </CardTitle>
          <CardDescription>
            Desconecte-se da sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;