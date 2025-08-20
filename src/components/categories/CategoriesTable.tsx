"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { Category } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
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

interface CategoriesTableProps {
  categories: Category[];
  onCategoryUpdated: () => void;
}

const CategoriesTable = ({ categories, onCategoryUpdated }: CategoriesTableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getCategoryTypeColor = (type: string) => {
    const normalizedType = type.trim().toLowerCase();
    if (normalizedType === 'receita' || normalizedType === 'income') {
      return 'bg-green-100 text-green-800';
    } else if (normalizedType === 'despesa' || normalizedType === 'expense') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const handleDelete = async (categoryId: string) => {
    setDeletingId(categoryId);
    
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      showSuccess("Categoria excluída com sucesso!");
      onCategoryUpdated();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      if (error.code === '23503') {
        showError("Não é possível excluir esta categoria pois ela está sendo usada em transações.");
      } else {
        showError("Erro ao excluir categoria. Tente novamente.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhuma categoria encontrada.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Crie sua primeira categoria clicando no botão "Nova Categoria".
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">
                {category.name}
              </TableCell>
              <TableCell>
                <Badge className={getCategoryTypeColor(category.type)}>
                  {category.type}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(category.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === category.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a categoria "{category.name}"?
                          Esta ação não pode ser desfeita e pode afetar transações existentes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(category.id)}
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
    </div>
  );
};

export default CategoriesTable;