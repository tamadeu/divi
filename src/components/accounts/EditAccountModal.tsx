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

interface Bank {
  id: string;
  name: string;
  logo_url: string | null;
  color: string;
}

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
    includeInTotal: true,
  });
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Helper function to map database account type to display type
  const mapAccountTypeForDisplay = (dbType: string) => {
    const normalizedType = dbType.trim().toLowerCase();
    switch (normalizedType) {
      case "conta corrente": return "Conta Corrente";
      case "poupança": return "Poupança";
      case "investimento": return "Investimento";
      case "cartão de crédito": return "Cartão de Crédito";
      case "dinheiro": return "Dinheiro";
      case "outros": return "Outros";
      default: return ""; // Fallback for unknown types
    }
  };

  // Helper function to find the exact bank name from the fetched list
  const getExactBankName = (dbBankName: string, availableBanks: Bank[]) => {
    const foundBank = availableBanks.find(
      (bank) => bank.name.trim().toLowerCase() === dbBankName.trim().toLowerCase()
    );
    return foundBank ? foundBank.name : ""; // Return the exact name from the list, or empty string
  };

  // Initialize form data when account changes or modal opens
  useEffect(() => {
    const initializeFormData = async () => {
      if (account && isOpen) {
        setLoadingBanks(true);
        const { data, error } = await supabase
          .from("banks")
          .select("id, name, logo_url, color")
          .order("name");

        if (error) {
          console.error("Error fetching banks:", error);
          showError("Erro ao carregar bancos");
          setBanks([]);
        } else {
          setBanks(data || []);
          const exactBankName = getExactBankName(account.bank, data || []);
          setFormData({
            name: account.name,
            bank: exactBankName, // Use the exact name from the fetched list
            type: mapAccountTypeForDisplay(account.type), // Map type for the Select component
            includeInTotal: account.include_in_total,
          });
        }
        setLoadingBanks(false);
      }
    };

    initializeFormData();
  }, [account, isOpen]); // Depend on 'account' and 'isOpen'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("accounts")
      .update({
        name: formData.name,
        bank: formData.bank,
        type: formData.type,
        include_in_total: formData.includeInTotal,
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
                autoFocus={false}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank">Banco</Label>
              <Select
                value={formData.bank}
                onValueChange={(value) => setFormData({ ...formData, bank: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingBanks ? "Carregando bancos..." : "Selecione o banco"} />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.name}>
                      <div className="flex items-center gap-2">
                        {bank.logo_url && (
                          <img 
                            src={bank.logo_url} 
                            alt={bank.name}
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        <span>{bank.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {banks.length === 0 && !loadingBanks && (
                    <SelectItem value="outros" disabled>
                      Nenhum banco encontrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={loading || !formData.bank || !formData.type}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountModal;