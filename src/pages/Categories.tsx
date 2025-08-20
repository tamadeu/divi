import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import CategoriesTable from "@/components/categories/CategoriesTable";
import EditCategoryModal from "@/components/categories/EditCategoryModal";
import DeleteCategoryAlert from "@/components/categories/DeleteCategoryAlert";
import { showError, showSuccess } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("expense");
  const { openAddCategoryModal } = useModal();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    const { error } = await supabase.from("categories").delete().eq("id", deletingCategory.id);
    if (error) {
      showError("Erro ao excluir categoria: " + error.message);
    } else {
      showSuccess("Categoria excluída com sucesso!");
      fetchCategories();
    }
    setDeletingCategory(null);
  };

  const expenseCategories = categories.filter(category => category.type === 'expense');
  const incomeCategories = categories.filter(category => category.type === 'income');

  const handleAddCategory = () => {
    const defaultType = activeTab === 'expense' ? 'expense' : 'income';
    openAddCategoryModal(fetchCategories, defaultType);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Categorias</h1>
        <Button size="sm" className="gap-1" onClick={handleAddCategory}>
          <PlusCircle className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Despesas</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="expense" className="mt-6">
            <CategoriesTable
              categories={expenseCategories}
              onEdit={(category) => setEditingCategory(category)}
              onDelete={(category) => setDeletingCategory(category)}
            />
          </TabsContent>
          
          <TabsContent value="income" className="mt-6">
            <CategoriesTable
              categories={incomeCategories}
              onEdit={(category) => setEditingCategory(category)}
              onDelete={(category) => setDeletingCategory(category)}
            />
          </TabsContent>
        </Tabs>
      )}

      <EditCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        onCategoryUpdated={fetchCategories}
      />
      <DeleteCategoryAlert
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        category={deletingCategory}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default CategoriesPage;