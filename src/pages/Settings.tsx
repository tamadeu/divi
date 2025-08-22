import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { WorkspaceManagement } from "@/components/settings/WorkspaceManagement";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { TransactionImportForm } from "@/components/settings/TransactionImportForm";
import { DownloadCSVTemplateButton } from "@/components/settings/DownloadCSVTemplateButton"; // Import the new component
import { useModal } from "@/contexts/ModalContext";

const Settings = () => {
  const { session } = useSession();
  const { onTransactionAdded } = useModal();

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
        <ProfileForm />
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
        <ChangePasswordForm />
      </div>

      {/* Importar Transações CSV */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Importar Transações (CSV)</h2>
          <p className="text-sm text-muted-foreground">
            Importe suas transações de despesa e renda a partir de um arquivo CSV.
          </p>
        </div>
        <div className="flex flex-col gap-4"> {/* Added a flex container for layout */}
          <DownloadCSVTemplateButton /> {/* Add the new button here */}
          <TransactionImportForm onImportComplete={onTransactionAdded} />
        </div>
      </div>
    </div>
  );
};

export default Settings;