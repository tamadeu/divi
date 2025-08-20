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

interface Account {
  id: string;
  name: string;
  bank: string;
  type: string;
}

interface AddCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardAdded: () => void;
}

const AddCreditCardModal = ({ isOpen, onClose, onCardAdded }: AddCreditCardModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    lastFourDigits: "",
    creditLimit: 0,
    closingDay: 1,
    dueDay: 10,
    accountId: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (isOpen && currentWorkspace) {
      fetchAccounts();
      setFormData({
        name: "",
        brand: "",
        lastFourDigits: "",
        creditLimit: 0,
        closingDay: 1,
        dueDay: 10,
        accountId: "",
        isActive: true,
      });
    }
  }, [isOpen, currentWorkspace]);

  const fetchAccounts = async () => {
    if (!currentWorkspace) return;

    setLoadingAccounts(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("id, name, bank, type")
      .eq("workspace_id", currentWorkspace.id)
      .order("name");

    if (error) {
      console.error("Error fetching accounts:", error);
      showError("Erro ao carregar contas");
    } else {
      setAccounts(data || []);
    }
    setLoadingAccounts(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWorkspace) {
      showError("Nenhum workspace selecionado");
      return;
    }

    // Validações
    if (formData.lastFourDigits.length !== 4 || !/^\d{4}$/.test(formData.lastFourDigits)) {
      showError("Os últimos 4 dígitos devem conter exatamente 4 números");
      return;
    }

    if (formData.closingDay < 1 || formData.closingDay > 31) {
      showError("Dia de fechamento deve estar entre 1 e 31");
      return;
    }

    if (formData.dueDay < 1 || formData.dueDay > 31) {
      showError("Dia de vencimento deve estar entre 1 e 31");
      return;
    }

    if (formData.creditLimit <= 0) {
      showError("Limite de crédito deve ser maior que zero");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Usuário não autenticado");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("credit_cards")
      .insert({
        user_id: user.id,
        workspace_id: currentWorkspace.id,
        account_id: formData.accountId,
        name: formData.name,
        brand: formData.brand,
        last_four_digits: formData.lastFourDigits,
        credit_limit: formData.creditLimit,
        closing_day: formData.closingDay,
        due_day: formData.dueDay,
        is_active: formData.isActive,
      });

    if (error) {
      showError("Erro ao criar cartão de crédito");
      console.error("Error creating credit card:", error);
    } else {
      showSuccess("Cartão de crédito criado com sucesso!");
      onClose();
      onCardAdded();
    }

    setLoading(false);
  };

  const creditCardBrands = [
    "Visa",
    "Mastercard",
    "American Express",
    "Elo",
    "Hipercard",
    "Diners Club",
    "Outros",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cartão de Crédito</DialogTitle>
          <DialogDescription>
            Adicione um novo cartão de crédito ao seu sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Cartão</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cartão Nubank, Itaú Mastercard..."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account">Conta Associada</Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) => setFormData({ ...formData, accountId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingAccounts ? "Carregando contas..." : "Selecione a conta"} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.bank}
                    </SelectItem>
                  ))}
                  {accounts.length === 0 && !loadingAccounts && (
                    <SelectItem value="no-accounts" disabled>
                      Nenhuma conta encontrada
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brand">Bandeira</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(value) => setFormData({ ...formData, brand: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a bandeira" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditCardBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lastFourDigits">Últimos 4 Dígitos</Label>
                <Input
                  id="lastFourDigits"
                  value={formData.lastFourDigits}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData({ ...formData, lastFourDigits: value });
                  }}
                  placeholder="1234"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="creditLimit">Limite de Crédito</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="closingDay">Dia de Fechamento</Label>
                <Select
                  value={formData.closingDay.toString()}
                  onValueChange={(value) => setFormData({ ...formData, closingDay: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dueDay">Dia de Vencimento</Label>
                <Select
                  value={formData.dueDay.toString()}
                  onValueChange={(value) => setFormData({ ...formData, dueDay: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Cartão ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name || !formData.brand || !formData.accountId || !formData.lastFourDigits}
            >
              {loading ? "Criando..." : "Criar Cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCreditCardModal;