import { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import EditCategoryModal from "@/components/categories/EditCategoryModal";
import { Category } from "@/types/database"; // Import Category type

interface CategoryWithParentName extends Category {
  parent_name?: string | null;
}

const Categories = () => {
  const [categories, setCategories] = useState<CategoryWithParentName[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("expense");
  const { openAddCategoryModal } = useModal();
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (currentWorkspace) {
      fetchCategories();
    }
  }, [currentWorkspace]);

  const fetchCategories = async () => {
    if (!currentWorkspace) return;

    const { data, error } = await supabase
      .from("categories")
      .select("*, parent_category:parent_category_id(name)") // Fetch parent category name
      .eq("workspace_id", currentWorkspace.id)
      .order("name");

    if (error) {
      showError("Erro ao carregar categorias");
      console.error("Error fetching categories:", error);
    } else {
      const formattedCategories: CategoryWithParentName[] = (data || []).map(cat => ({
        ...cat,
        parent_name: cat.parent_category ? (cat.parent_category as { name: string }).name : null,
      }));
      setCategories(formattedCategories);
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      showError("Erro ao excluir categoria");
    } else {
      showSuccess("Categoria excluída com sucesso!");
      fetchCategories();
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const handleCategoryUpdated = () => {
    fetchCategories();
    setIsEditModalOpen(false);
    setEditingCategory(null);
  };

  const getTypeColor = (type: string) => {
    const normalizedType = type.trim().toLowerCase();
    if (normalizedType === "receita" || normalizedType === "income") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    } else if (normalizedType === "despesa" || normalizedType === "expense") {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
    return "bg-gray-100 text-gray-800"; // Default
  };

  const getTypeLabel = (type: string) => {
    const normalizedType = type.trim().toLowerCase();
    if (normalizedType === "receita" || normalizedType === "income") {
      return "Receita";
    } else if (normalizedType === "despesa" || normalizedType === "expense") {
      return "Despesa";
    }
    return type; // Fallback
  };

  const getFilteredCategories = (tabType: string) => {
    const targetType = tabType.trim().toLowerCase();

    const filtered = categories.filter(category => {
      const normalizedCategoryType = category.type.trim().toLowerCase();
      if (targetType === "expense") {
        return normalizedCategoryType === "despesa" || normalizedCategoryType === "expense";
      } else if (targetType === "income") {
        return normalizedCategoryType === "receita" || normalizedCategoryType === "income";
      }
      return false;
    });

    // Sort to display parent categories first, then subcategories indented
    const sortedCategories = [...filtered].sort((a, b) => {
      if (a.parent_category_id === b.parent_category_id) {
        return a.name.localeCompare(b.name);
      }
      if (!a.parent_category_id && b.parent_category_id) return -1; // Parents before children
      if (a.parent_category_id && !b.parent_category_id) return 1; // Children after parents
      return a.name.localeCompare(b.name); // Sort by name if both are subcategories
    });

    return sortedCategories;
  };

  const renderCategoryName = (category: CategoryWithParentName) => {
    if (category.parent_name) {
      return (
        <span className="ml-4">
          <span className="text-muted-foreground">{category.parent_name} &gt; </span>
          {category.name}
        </span>
      );
    }
    return category.name;
  };

  const renderCategoryCards = (categoryList: CategoryWithParentName[]) => (
    <div className="grid gap-4 md:hidden">
      {categoryList.map((category) => (
        <Card key={category.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{renderCategoryName(category)}</CardTitle>
              </div>
              <Badge className={getTypeColor(category.type)}>
                {getTypeLabel(category.type)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditCategory(category)}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a categoria "{category.name}"? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteCategory(category.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCategoryTable = (categoryList: CategoryWithParentName[]) => (
    <Card className="hidden md:block">
      <CardHeader>
        <CardTitle>Categorias de {activeTab === "expense" ? "Despesa" : "Receita"}</CardTitle>
        <CardDescription>
          Gerencie suas categorias de {activeTab === "expense" ? "despesa" : "receita"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryList.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  {renderCategoryName(category)}
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(category.type)}>
                    {getTypeLabel(category.type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a categoria "{category.name}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCategory(category.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Categorias</h1>
            <p className="text-muted-foreground">
              Organize suas transações por categorias.
            </p>
          </div>
          <Button onClick={() => openAddCategoryModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>
        <div className="text-center py-8">Carregando categorias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">
            Organize suas transações por categorias.
          </p>
        </div>
        <Button onClick={() => openAddCategoryModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Nenhuma categoria encontrada</h3>
              <p className="text-muted-foreground">
                Comece criando sua primeira categoria.
              </p>
              <Button onClick={() => openAddCategoryModal()} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Categoria
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">
              Despesas ({getFilteredCategories("expense").length})
            </TabsTrigger>
            <TabsTrigger value="income">
              Receitas ({getFilteredCategories("income").length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="expense" className="space-y-4">
            {getFilteredCategories("expense").length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Nenhuma categoria de despesa encontrada</h3>
                    <p className="text-muted-foreground">
                      Crie categorias para organizar suas despesas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {renderCategoryCards(getFilteredCategories("expense"))}
                {renderCategoryTable(getFilteredCategories("expense"))}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="income" className="space-y-4">
            {getFilteredCategories("income").length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Nenhuma categoria de receita encontrada</h3>
                    <p className="text-muted-foreground">
                      Crie categorias para organizar suas receitas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {renderCategoryCards(getFilteredCategories("income"))}
                {renderCategoryTable(getFilteredCategories("income"))}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <EditCategoryModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCategory(null);
          }}
          category={editingCategory}
          onCategoryUpdated={handleCategoryUpdated}
        />
      )}
    </div>
  );
};

export default Categories;