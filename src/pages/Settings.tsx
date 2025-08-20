import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/contexts/SessionContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { WorkspaceManagement } from "@/components/settings/WorkspaceManagement";

const Settings = () => {
  const { session } = useSession();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
    }
  }, [profile]);

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

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      showError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      showError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showSuccess('Senha atualizada com sucesso!');
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      showError('Erro ao atualizar senha: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      {/* Perfil */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Perfil</h2>
          <p className="text-sm text-muted-foreground">
            Atualize suas informações pessoais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Digite seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Digite seu sobrenome"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            value={session?.user?.email || ""}
            disabled
            className="bg-muted"
          />
        </div>

        <Button onClick={handleUpdateProfile} disabled={loading}>
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Núcleos Financeiros - usando o componente existente */}
      <WorkspaceManagement />

      {/* Alterar Senha */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Alterar Senha</h2>
          <p className="text-sm text-muted-foreground">
            Atualize sua senha de acesso.
          </p>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
            />
          </div>

          <Button onClick={handleUpdatePassword} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar Senha"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;