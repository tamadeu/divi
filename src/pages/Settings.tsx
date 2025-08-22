import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { WorkspaceManagement } from "@/components/settings/WorkspaceManagement";
import { ProfileForm } from "@/components/settings/ProfileForm"; // Import ProfileForm
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm"; // Import ChangePasswordForm

const Settings = () => {
  const { session } = useSession();
  // Removed direct profile state and update logic, now handled by ProfileForm
  // Removed direct password state and update logic, now handled by ChangePasswordForm

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
        <ProfileForm /> {/* Use the ProfileForm component */}
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
        <ChangePasswordForm /> {/* Use the ChangePasswordForm component */}
      </div>
    </div>
  );
};

export default Settings;