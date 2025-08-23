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
import { Category } from "@/types/database"; // Import Category type
import { useWorkspace } from "@/contexts/WorkspaceContext";

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
    parent_category_id: "" // New state for parent category
  });
  const [loading, setLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]); // State for parent categories
  const { currentWorkspace } = useWorkspace();

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
        parent_category_id: category.parent_category_id || "" // Set initial parent
      });
    }
  }, [category]); // Depend on 'category' to re-initialize when a new category is selected

  // Fetch parent categories when modal opens or category type changes
  useEffect(() => {
    const fetchParentCategories = async () => {
      if (!currentWorkspace || !formData.type || !category) return;

      const typeToFilter = formData.type === 'Receita' ? 'income' : 'expense';

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, type')
        .eq('workspace_id', currentWorkspace.id)
        .eq('type', typeToFilter)
        .is('parent_category_id', null) // Only top-level categories
        .neq('id', category.id) // Exclude the current category itself
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching parent categories:", error);
        showError("Erro ao carregar categorias pai.");
      } else {
        setParentCategories(data || []);
      }
    };

    if (isOpen) {
      fetchParentCategories();
    }
  }, [isOpen, formData.type, currentWorkspace, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Map display type back to database type
    const typeToSave = formData.type === 'Receita' ? 'income' : 'expense'; 

    const { error } = await supabase
      .from("categories")
      .update({
        name: formData.name,
        type: typeToSave,
        parent_category_id: formData.parent_category_id || null, // Update parent_category_id
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
                onValueChange={(value) => setFormData({ ...formData, type: value, parent_category_id: "" })} // Reset parent when type changes
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
            <div className="grid gap-2">
              <Label htmlFor="parent-category">Categoria Pai (Opcional)</Label>
              <Select
                value={formData.parent_category_id || ""}
                onValueChange={(value) => setFormData({ ...formData, parent_category_id: value || null })}
                disabled={!formData.type} // Disable if no type is selected
              >
                <SelectTrigger id="parent-category">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
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