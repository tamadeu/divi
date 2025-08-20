import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import CompaniesTable from "@/components/admin/CompaniesTable";
import AddEditCompanyModal from "@/components/admin/AddEditCompanyModal";
import DeleteCompanyAlert from "@/components/admin/DeleteCompanyAlert";
import { Input } from "@/components/ui/input";

const AdminCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching companies:', error);
        showError('Erro ao carregar empresas');
        return;
      }

      setCompanies(data || []);
      setFilteredCompanies(data || []);
    } catch (error) {
      console.error('Error in fetchCompanies:', error);
      showError('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    let filtered = companies;

    if (searchQuery) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCompanies(filtered);
  }, [companies, searchQuery]);

  const handleAddCompany = () => {
    setEditingCompany(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setDeletingCompany(company);
    setIsDeleteAlertOpen(true);
  };

  const deleteImageFromStorage = async (url: string) => {
    try {
      if (url && url.includes('supabase')) {
        // Extract filename from URL
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        if (fileName) {
          await supabase.storage
            .from('company-logos')
            .remove([fileName]);
        }
      }
    } catch (error) {
      console.error('Error deleting image from storage:', error);
      // Don't throw error, just log it
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCompany) return;

    try {
      // Delete image from storage if it exists
      if (deletingCompany.logo_url) {
        await deleteImageFromStorage(deletingCompany.logo_url);
      }

      // Delete company from database
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', deletingCompany.id);

      if (error) throw error;

      showSuccess('Empresa excluída com sucesso!');
      fetchCompanies();
    } catch (error: any) {
      showError('Erro ao excluir empresa: ' + error.message);
    } finally {
      setIsDeleteAlertOpen(false);
      setDeletingCompany(null);
    }
  };

  const handleCompanySaved = () => {
    fetchCompanies();
    setIsAddEditModalOpen(false);
    setEditingCompany(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Gerenciar Empresas</h1>
        <Button size="sm" className="gap-1" onClick={handleAddCompany}>
          <PlusCircle className="h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas da Plataforma</CardTitle>
          <CardDescription>
            Gerencie as empresas disponíveis no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Buscar por nome da empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : filteredCompanies.length > 0 ? (
            <CompaniesTable 
              companies={filteredCompanies} 
              onEdit={handleEditCompany}
              onDelete={handleDeleteCompany}
              loading={loading}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  {searchQuery ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? 'Tente ajustar sua busca ou limpar o filtro.'
                    : 'Comece adicionando a primeira empresa da plataforma.'
                  }
                </p>
                {!searchQuery && (
                  <Button className="mt-4" onClick={handleAddCompany}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Empresa
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddEditCompanyModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingCompany(null);
        }}
        onCompanySaved={handleCompanySaved}
        company={editingCompany}
      />

      <DeleteCompanyAlert
        isOpen={isDeleteAlertOpen}
        onClose={() => {
          setIsDeleteAlertOpen(false);
          setDeletingCompany(null);
        }}
        company={deletingCompany}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default AdminCompanies;