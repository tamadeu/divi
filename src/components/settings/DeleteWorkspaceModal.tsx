"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WorkspaceWithRole } from "@/types/workspace";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

interface DeleteWorkspaceModalProps {
  workspace: WorkspaceWithRole;
  isOpen: boolean;
  onClose: () => void;
}

const DeleteWorkspaceModal = ({ workspace, isOpen, onClose }: DeleteWorkspaceModalProps) => {
  console.log("DeleteWorkspaceModal: Component rendered. isOpen:", isOpen, "workspace name:", workspace?.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { refreshWorkspaces, switchWorkspace, workspaces } = useWorkspace();

  const handleDelete = async () => {
    console.log("DeleteWorkspaceModal: handleDelete called inside modal for workspace:", workspace.name);

    if (confirmationText !== workspace.name) {
      showError("O nome do núcleo não confere. Digite exatamente: " + workspace.name);
      return;
    }

    setIsDeleting(true);

    try {
      // Primeiro, deletar todas as associações de usuários
      const { error: usersError } = await supabase
        .from('workspace_users')
        .delete()
        .eq('workspace_id', workspace.id);

      if (usersError) throw usersError;

      // Depois, deletar o workspace
      const { error: workspaceError } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspace.id);

      if (workspaceError) throw workspaceError;

      showSuccess("Núcleo financeiro excluído com sucesso!");
      
      // Se o workspace excluído era o atual, mudar para outro
      const remainingWorkspaces = workspaces.filter(w => w.id !== workspace.id);
      if (remainingWorkspaces.length > 0) {
        switchWorkspace(remainingWorkspaces[0].id);
      } else {
        // If no other workspaces, clear current workspace
        switchWorkspace("");
      }
      
      await refreshWorkspaces();
      onClose();
    } catch (error: any) {
      console.error("Error deleting workspace:", error);
      showError("Erro ao excluir núcleo financeiro: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Núcleo Financeiro
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o núcleo financeiro
            <strong> "{workspace.name}" </strong> e todos os dados associados (transações, contas, categorias, etc.).
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4">
            <p className="text-sm text-destructive font-medium mb-2">
              ⚠️ Atenção: Esta ação é irreversível!
            </p>
            <p className="text-sm text-muted-foreground">
              Todos os dados deste núcleo serão perdidos permanentemente, incluindo:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside">
              <li>Todas as transações</li>
              <li>Todas as contas</li>
              <li>Todas as categorias</li>
              <li>Todos os orçamentos</li>
              <li>Associações de usuários</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Para confirmar, digite o nome do núcleo: <strong>{workspace.name}</strong>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={workspace.name}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting || confirmationText !== workspace.name}
          >
            {isDeleting ? "Excluindo..." : "Excluir Permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteWorkspaceModal;