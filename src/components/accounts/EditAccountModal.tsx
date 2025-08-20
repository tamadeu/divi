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

interface Account {
  id: string;
  name: string;
  bank: string;
  type: string;
  balance: number;
  is_default: boolean;
  include_in_total: boolean;
}

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onAccountUpdated: () => void;
}

const EditAccountModal = ({ isOpen, onClose, account, onAccountUpdated }: EditAccountModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    bank: "",
    type: "",
    balance: 0,
    include_in_total: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        bank: account.bank,
        type: account.type,
        balance: account.balance,
        include_in_total: account.include_in_total,
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("accounts")
      .update({
        name: formData.name,
        bank: formData.bank,
        type: formData.type,
        balance: formData.balance,
        include_in_total: formData.include_in_total,
      })
      .eq("id", account.id);

    if (error) {
      showError("Erro ao atualizar conta");
      console.error("Error updating account:", error);
    } else {
      showSuccess("Conta atualizada com sucesso!");
      onAccountUpdated();
    }
    setLoading(false);
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
          <DialogTitle>Editar Conta</DialogTitle>
          <DialogDescription>
            Atualize as informações da sua conta.
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
              <Label htmlFor="balance">Saldo Inicial</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="include_in_total"
                checked={formData.include_in_total}
                onCheckedChange={(checked) => setFormData({ ...formData, include_in_total: checked })}
              />
              <Label htmlFor="include_in_total">Incluir no saldo total</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountModal;