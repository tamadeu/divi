import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Package, UserCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPlan } from "@/types/subscription-plans";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import SubscriptionPlansTable from "@/components/admin/SubscriptionPlansTable";
import DeletePlanAlert from "@/components/admin/DeletePlanAlert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Modal states
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    
    try {
      // First, get all plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (plansError) {
        console.error('Error fetching plans:', plansError);
        showError('Erro ao carregar planos');
        return;
      }

      // Then, for exclusive plans, get user data using the admin function
      const plansWithUserData = await Promise.all(
        (plansData || []).map(async (plan) => {
          if (plan.is_exclusive && plan.exclusive_user_id) {
            try {
              const { data: userData, error: userError } = await supabase.functions.invoke('admin-list-users', {
                body: { userId: plan.exclusive_user_id }
              });

              if (!userError && userData?.users?.length > 0) {
                return {
                  ...plan,
                  exclusive_user: userData.users[0]
                };
              }
            } catch (error) {
              console.error('Error fetching user data for plan:', plan.id, error);
            }
          }
          return plan;
        })
      );

      setPlans(plansWithUserData);
      setFilteredPlans(plansWithUserData);
    } catch (error) {
      console.error('Error in fetchPlans:', error);
      showError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    let filtered = plans;

    // Filtrar por busca
    if (searchQuery) {
      filtered = filtered.filter(plan => 
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(plan => plan.is_active);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(plan => !plan.is_active);
      } else if (statusFilter === "featured") {
        filtered = filtered.filter(plan => plan.is_featured);
      }
    }

    // Filtrar por tipo
    if (typeFilter !== "all") {
      if (typeFilter === "exclusive") {
        filtered = filtered.filter(plan => plan.is_exclusive);
      } else if (typeFilter === "public") {
        filtered = filtered.filter(plan => !plan.is_exclusive);
      }
    }

    setFilteredPlans(filtered);
  }, [plans, searchQuery, statusFilter, typeFilter]);

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setDeletingPlan(plan);
    setIsDeleteAlertOpen(true);
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) throw error;

      showSuccess(`Plano ${!plan.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      fetchPlans();
    } catch (error: any) {
      showError('Erro ao alterar status do plano: ' + error.message);
    }
  };

  const handleToggleFeatured = async (plan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_featured: !plan.is_featured })
        .eq('id', plan.id);

      if (error) throw error;

      showSuccess(`Plano ${!plan.is_featured ? 'destacado' : 'removido do destaque'} com sucesso!`);
      fetchPlans();
    } catch (error: any) {
      showError('Erro ao alterar destaque do plano: ' + error.message);
    }
  };

  const handleMoveUp = async (plan: SubscriptionPlan) => {
    const currentIndex = plans.findIndex(p => p.id === plan.id);
    if (currentIndex <= 0) return;

    const previousPlan = plans[currentIndex - 1];
    
    try {
      // Swap sort orders
      await supabase
        .from('subscription_plans')
        .update({ sort_order: previousPlan.sort_order })
        .eq('id', plan.id);

      await supabase
        .from('subscription_plans')
        .update({ sort_order: plan.sort_order })
        .eq('id', previousPlan.id);

      fetchPlans();
    } catch (error: any) {
      showError('Erro ao reordenar planos: ' + error.message);
    }
  };

  const handleMoveDown = async (plan: SubscriptionPlan) => {
    const currentIndex = plans.findIndex(p => p.id === plan.id);
    if (currentIndex >= plans.length - 1) return;

    const nextPlan = plans[currentIndex + 1];
    
    try {
      // Swap sort orders
      await supabase
        .from('subscription_plans')
        .update({ sort_order: nextPlan.sort_order })
        .eq('id', plan.id);

      await supabase
        .from('subscription_plans')
        .update({ sort_order: plan.sort_order })
        .eq('id', nextPlan.id);

      fetchPlans();
    } catch (error: any) {
      showError('Erro ao reordenar planos: ' + error.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlan) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', deletingPlan.id);

      if (error) throw error;

      showSuccess('Plano excluído com sucesso!');
      fetchPlans();
    } catch (error: any) {
      showError('Erro ao excluir plano: ' + error.message);
    } finally {
      setIsDeleteAlertOpen(false);
      setDeletingPlan(null);
    }
  };

  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.is_active).length;
  const featuredPlans = plans.filter(p => p.is_featured).length;
  const exclusivePlans = plans.filter(p => p.is_exclusive).length;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Gerenciar Planos de Assinatura</h1>
        <Button size="sm" className="gap-1" asChild>
          <Link to="/admin/plans/new">
            <PlusCircle className="h-4 w-4" />
            Novo Plano
          </Link>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlans}</div>
            <p className="text-xs text-muted-foreground">
              Planos cadastrados no sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePlans}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para assinatura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos em Destaque</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{featuredPlans}</div>
            <p className="text-xs text-muted-foreground">
              Destacados na página de preços
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Exclusivos</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{exclusivePlans}</div>
            <p className="text-xs text-muted-foreground">
              Planos por demanda
            
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos de Assinatura</CardTitle>
          <CardDescription>
            Gerencie os planos de assinatura disponíveis na plataforma, incluindo planos exclusivos por demanda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Apenas Ativos</SelectItem>
                <SelectItem value="inactive">Apenas Inativos</SelectItem>
                <SelectItem value="featured">Em Destaque</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="public">Planos Públicos</SelectItem>
                <SelectItem value="exclusive">Planos Exclusivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : filteredPlans.length > 0 ? (
            <SubscriptionPlansTable 
              plans={filteredPlans} 
              onDelete={handleDeletePlan}
              onToggleActive={handleToggleActive}
              onToggleFeatured={handleToggleFeatured}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              loading={loading}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all" ? 'Nenhum plano encontrado' : 'Nenhum plano cadastrado'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? 'Tente ajustar sua busca ou filtros.'
                    : 'Comece criando o primeiro plano de assinatura da plataforma.'
                  }
                </p>
                {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
                  <Button className="mt-4" asChild>
                    <Link to="/admin/plans/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Criar Primeiro Plano
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DeletePlanAlert
        isOpen={isDeleteAlertOpen}
        onClose={() => {
          setIsDeleteAlertOpen(false);
          setDeletingPlan(null);
        }}
        plan={deletingPlan}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default AdminPlans;