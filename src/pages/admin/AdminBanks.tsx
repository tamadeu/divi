import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Bank } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import BanksTable from "@/components/admin/BanksTable";
import AddEditBankModal from "@/components/admin/AddEditBankModal";
import DeleteBankAlert from "@/components/admin/DeleteBankAlert";
import { Input } from "@/components/ui/input";

const AdminBanks = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingBank, setDeletingBank] = useState<Bank | null>(null);

  const fetchBanks = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching banks:', error);
        showError('Erro ao carregar bancos');
        return;
      }

      setBanks(data || []);
      setFilteredBanks(data || []);
    } catch (error) {
      console.error('Error in fetchBanks:', error);
      showError('Erro ao carregar bancos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    let filtered = banks;

    if (searchQuery) {
      filtered = filtered.filter(bank => 
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBanks(filtered);
  }, [banks, searchQuery]);

  const handleAddBank = () => {
    setEditingBank(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditBank = (bank: Bank) => {
    setEditingBank(bank);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteBank = (bank: Bank) => {
    setDeletingBank(bank);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBank) return;

    try {
      const { error } = await supabase
        .from('banks')
        .delete()
        .eq('id', deletingBank.id);

      if (error) throw error;

      showSuccess('Banco excluído com sucesso!');
      fetchBanks();
    } catch (error: any) {
      showError('Erro ao excluir banco: ' + error.message);
    } finally {
      setIsDeleteAlertOpen(false);
      setDeletingBank(null);
    }
  };

  const handleBankSaved = () => {
    fetchBanks();
    setIsAddEditModalOpen(false);
    setEditingBank(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Gerenciar Bancos</h1>
        <Button size="sm" className="gap-1" onClick={handleAddBank}>
          <PlusCircle className="h-4 w-4" />
          Novo Banco
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bancos da Plataforma</CardTitle>
          <CardDescription>
            Gerencie os bancos disponíveis para os usuários ao criar contas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Buscar por nome do banco..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : filteredBanks.length > 0 ? (
            <BanksTable 
              banks={filteredBanks} 
              onEdit={handleEditBank}
              onDelete={handleDeleteBank}
              loading={loading}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  {searchQuery ? 'Nenhum banco encontrado' : 'Nenhum banco cadastrado'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? 'Tente ajustar sua busca ou limpar o filtro.'
                    : 'Comece adicionando o primeiro banco da plataforma.'
                  }
                </p>
                {!searchQuery && (
                  <Button className="mt-4" onClick={handleAddBank}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Banco
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddEditBankModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingBank(null);
        }}
        onBankSaved={handleBankSaved}
        bank={editingBank}
      />

      <DeleteBankAlert
        isOpen={isDeleteAlertOpen}
        onClose={() => {
          setIsDeleteAlertOpen(false);
          setDeletingBank(null);
        }}
        bank={deletingBank}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default AdminBanks;