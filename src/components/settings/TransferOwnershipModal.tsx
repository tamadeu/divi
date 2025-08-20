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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { WorkspaceWithRole, WorkspaceUser } from "@/types/workspace";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { showSuccess, showError } from "@/utils/toast";

interface TransferOwnershipModalProps {
  workspace: WorkspaceWithRole;
  members: WorkspaceUser[];
  isOpen: boolean;
  onClose: () => void;
  onOwnershipTransferred: () => void;
}

const TransferOwnershipModal = ({ 
  workspace, 
  members, 
  isOpen, 
  onClose, 
  onOwnershipTransferred 
}: TransferOwnershipModalProps) => {
  const { transferOwnership } = useWorkspace();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransfer = async () => {
    if (!selectedUserId) {
      showError("Selecione um usuário para transferir a propriedade.");
      return;
    }

    setIsTransferring(true);

    try {
      const success = await transferOwnership(workspace.id, selectedUserId);
      
      if (success) {
        showSuccess("Propriedade transferida com sucesso!");
        onOwnershipTransferred();
        onClose();
      }
    } catch (error) {
      console.error("Error transferring ownership:", error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId("");
    onClose();
  };

  const getMemberName = (member: WorkspaceUser) => {
    if (member.is_ghost_user) {
      return member.ghost_user_name || 'Usuário Fantasma';
    }
    
    if (member.profile?.first_name || member.profile?.last_name) {
      return `${member.profile.first_name || ''} ${member.profile.last_name || ''}`.trim();
    }
    
    if (member.email) {
      return member.email.split('@')[0];
    }
    
    return `Usuário ${member.user_id?.slice(0, 8) || 'Desconhecido'}`;
  };

  const getMemberEmail = (member: WorkspaceUser) => {
    if (member.is_ghost_user) {
      return member.ghost_user_email || 'Usuário fictício';
    }
    
    return member.email || 'Email não disponível';
  };

  const getMemberInitials = (member: WorkspaceUser) => {
    const name = getMemberName(member);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filtrar apenas usuários reais (não fantasmas) que não são o proprietário atual
  const eligibleMembers = members.filter(m => 
    !m.is_ghost_user && 
    m.user_id && 
    m.user_id !== workspace.workspace_owner
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferir Propriedade
          </DialogTitle>
          <DialogDescription>
            Transfira a propriedade deste núcleo financeiro para outro membro.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">
                  ⚠️ Atenção: Esta ação é irreversível!
                </p>
                <p className="text-amber-700">
                  Ao transferir a propriedade, você perderá o controle total sobre este núcleo. 
                  O novo proprietário poderá remover você ou alterar suas permissões.
                </p>
              </div>
            </div>
          </div>

          {eligibleMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Não há membros elegíveis para receber a propriedade.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Adicione pelo menos um usuário real (não fictício) ao núcleo.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="new-owner">Novo Proprietário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo proprietário..." />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMembers.map((member) => (
                    <SelectItem key={member.id} value={member.user_id!}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.profile?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {getMemberInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{getMemberName(member)}</div>
                          <div className="text-xs text-muted-foreground">
                            {getMemberEmail(member)}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleTransfer}
            disabled={isTransferring || !selectedUserId || eligibleMembers.length === 0}
          >
            {isTransferring ? "Transferindo..." : "Transferir Propriedade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferOwnershipModal;