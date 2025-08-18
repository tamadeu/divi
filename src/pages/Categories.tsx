import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import CategoriesTable from "@/components/categories/CategoriesTable";
import AddCategoryModal from "@/components/categories/AddCategoryModal";
import EditCategoryModal from "@/components/categories/EditCategoryModal";
import DeleteCategoryAlert from "@/components/categories/DeleteCategoryAlert";
import { showError, showSuccess } from "@/utils/toast";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  return (
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold md:text-2xl">Categorias</h1>
              <Button size="sm" className="gap-1" onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Nova Categoria
              </Button>
            </div>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <CategoriesTable
                categories={categories}
                onEdit={(category) => setEditingCategory(category)}
                onDelete={(category) => setDeletingCategory(category)}
              />
            )}
          </main>
        </div>
      </div>
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCategoryAdded={fetchCategories}
      />
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