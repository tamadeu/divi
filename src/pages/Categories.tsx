import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Category } from "@/types/database";
import CategoriesTable from "@/components/categories/CategoriesTable";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useModal } from "@/contexts/ModalContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { openAddCategoryModal } = useModal();
  const { currentWorkspace } = useWorkspace();

  const fetchCategories = async () => {
    if (!currentWorkspace) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("workspace_id", currentWorkspace.id)
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentWorkspace) {
      fetchCategories();
    }
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Nenhum núcleo financeiro selecionado</h2>
          <p className="text-muted-foreground">Selecione um núcleo financeiro para ver suas categorias.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Categorias</h1>
        <Button onClick={() => openAddCategoryModal(fetchCategories)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Suas Categorias</CardTitle>
          <CardDescription>
            Organize suas transações com categorias personalizadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <CategoriesTable categories={categories} onCategoryUpdated={fetchCategories} />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default CategoriesPage;