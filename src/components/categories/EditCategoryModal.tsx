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

interface Category {
  id: string;
  name: string;
  type: string;
}

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  onCategoryUpdated: () => void;
}

const EditCategoryModal = ({ isOpen, onClose, category, onCategoryUpdated }: EditCategoryModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
  });
  const [loading, setLoading] = useState(false);

  // Helper function to map database types to display types
  const mapCategoryTypeForDisplay = (dbType: string) => {
    const normalizedType = dbType.trim().toLowerCase();
    if (normalizedType === "receita" || normalizedType === "income") {
      return "Receita";
    } else if (normalizedType === "despesa" || normalizedType === "expense") {
      return "Despesa";
    }
    return ""; // Fallback for unknown types
  };

  // Initialize form data when category prop changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: mapCategoryTypeForDisplay(category.type), // Map type for the Select component
      });
    }
  }, [category]); // Depend on 'category' to re-initialize when a new category is selected

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Map display type back to database type if necessary, though current DB seems to accept "Receita"/"Despesa"
    const typeToSave = formData.type; 

    const { error } = await supabase
      .from("categories")
      .update({
        name: formData.name,
        type: typeToSave,
      })
      .eq("id", category.id);

    if (error) {
      showError("Erro ao atualizar categoria");
      console.error("Error updating category:", error);
    } else {
      showSuccess("Categoria atualizada com sucesso!");
      onCategoryUpdated();
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
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogDescription>
            Atualize as informações da sua categoria.
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
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;