import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
}

const AddAccountModal = ({ isOpen, onClose, onAccountAdded }: AddAccountModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    bank: "",
    type: "",
    initialBalance: 0,
    includeInTotal: true,
  });
  const [loading, setLoading] = useState(false);
  const { currentWorkspace } = useWorkspace();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        bank: "",
        type: "",
        initialBalance: 0,
        includeInTotal: true,
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWorkspace) {
      showError("Nenhum workspace selecionado");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Usuário não autenticado");
      setLoading(false);
      return;
    }

    // Create account
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        workspace_id: currentWorkspace.id,
        name: formData.name,
        bank: formData.bank,
        type: formData.type,
        balance: formData.initialBalance,
        include_in_total: formData.includeInTotal,
      })
      .select()
      .single();

    if (accountError) {
      showError("Erro ao criar conta");
      console.error("Error creating account:", accountError);
      setLoading(false);
      return;
    }

    // If there's an initial balance, create a transaction
    if (formData.initialBalance !== 0) {
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          workspace_id: currentWorkspace.id,
          account_id: account.id,
          name: "Saldo inicial",
          amount: formData.initialBalance,
          date: new Date().toISOString(),
          description: `Saldo inicial da conta ${formData.name}`,
          status: "Concluído",
        });

      if (transactionError) {
        console.error("Error creating initial transaction:", transactionError);
        // Don't show error to user as account was created successfully
      }
    }

    showSuccess("Conta criada com sucesso!");
    setLoading(false);
    onClose();
    onAccountAdded(); // This will refresh the accounts list
  };

  const accountTypes = [
    "Conta Corrente",
    "Poupança",
    "Investimento",
    "Cartão de Crédito",
    "Dinheiro",
    "Outros",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
          <DialogDescription>
            Adicione uma nova conta bancária ou cartão de crédito.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Conta</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Conta Corrente Banco do Brasil"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank">Banco</Label>
              <Input
                id="bank"
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                placeholder="Ex: Banco do Brasil"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Conta</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="initialBalance">Saldo Inicial</Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Se informado, será criada uma transação de saldo inicial.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="includeInTotal"
                checked={formData.includeInTotal}
                onCheckedChange={(checked) => setFormData({ ...formData, includeInTotal: checked })}
              />
              <Label htmlFor="includeInTotal">Incluir no saldo total</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountModal;