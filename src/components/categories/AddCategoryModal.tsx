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
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Category } from "@/types/database"; // Import Category type

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: (newCategory: Category | null) => void; // Changed to pass new Category
  defaultType?: 'income' | 'expense'; // Added defaultType prop
  defaultName?: string; // New prop for default name
}

const AddCategoryModal = ({ isOpen, onClose, onCategoryAdded, defaultType, defaultName }: AddCategoryModalProps) => {
  const [formData, setFormData] = useState({
    name: defaultName || "", // Initialize with defaultName
    type: defaultType === 'income' ? 'Receita' : (defaultType === 'expense' ? 'Despesa' : ''), // Initialize with defaultType
  });
  const [loading, setLoading] = useState(false);
  const { currentWorkspace } = useWorkspace();

  // Reset form when modal opens, considering defaultType and defaultName
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: defaultName || "",
        type: defaultType === 'income' ? 'Receita' : (defaultType === 'expense' ? 'Despesa' : ''),
      });
    }
  }, [isOpen, defaultType, defaultName]); // Added defaultName to dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWorkspace) {
      showError("Nenhum workspace selecionado");
      onCategoryAdded(null); // Indicate failure
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Usuário não autenticado");
      setLoading(false);
      onCategoryAdded(null); // Indicate failure
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        workspace_id: currentWorkspace.id,
        name: formData.name,
        type: formData.type,
      })
      .select() // Select the inserted data
      .single(); // Get a single object

    if (error) {
      showError("Erro ao criar categoria");
      console.error("Error creating category:", error);
      onCategoryAdded(null); // Pass null on error
    } else {
      showSuccess("Categoria criada com sucesso!");
      onClose();
      onCategoryAdded(data); // Pass the new category data
    }

    setLoading(false);
  };

  const categoryTypes = [
    { value: "Receita", label: "Receita" },
    { value: "Despesa", label: "Despesa" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
          <DialogDescription>
            Adicione uma nova categoria para organizar suas transações.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Alimentação, Salário, Transporte..."
                autoFocus={false}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                disabled={!!defaultType} // Disable type selection if defaultType is provided
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {categoryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.type}>
              {loading ? "Criando..." : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryModal;