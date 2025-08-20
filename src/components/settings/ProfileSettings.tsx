import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showError, showSuccess } from "@/utils/toast";
import { useSession } from "@/contexts/SessionContext";
import { useProfile } from "@/hooks/useProfile";
import { User, Upload } from "lucide-react";

const profileSchema = z.object({
  first_name: z.string().min(1, "Nome é obrigatório"),
  last_name: z.string().min(1, "Sobrenome é obrigatório"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileSettings = () => {
  const { session } = useSession();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          first_name: values.first_name,
          last_name: values.last_name,
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
    <Card>
      <CardHeader>
        <CardTitle>Informações Pessoais</CardTitle>
        <CardDescription>
          Atualize suas informações pessoais e foto de perfil.
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
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{getDisplayName()}</h3>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            <Button variant="outline" size="sm" disabled>
              <Upload className="h-4 w-4 mr-2" />
              Alterar Foto
            </Button>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                {...form.register("first_name")}
                placeholder="Seu nome"
              />
              {form.formState.errors.first_name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                {...form.register("last_name")}
                placeholder="Seu sobrenome"
              />
              {form.formState.errors.last_name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={session?.user?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado por questões de segurança.
            </p>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;