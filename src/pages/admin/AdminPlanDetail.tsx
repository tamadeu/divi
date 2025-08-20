import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPlan, PLAN_FEATURES } from "@/types/subscription-plans";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { 
  ArrowLeft, 
  Save, 
  Star, 
  Settings, 
  Zap, 
  DollarSign, 
  Infinity,
  Check,
  X,
  Calendar,
  Package,
  UserCheck,
  Eye,
  EyeOff
} from "lucide-react";
import DeletePlanAlert from "@/components/admin/DeletePlanAlert";
import { UserSearchCombobox } from "@/components/admin/UserSearchCombobox";

const AdminPlanDetail = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({});

  const isNewPlan = planId === 'new';

  const fetchPlan = async () => {
    if (isNewPlan) {
      // Initialize new plan with default values
      const newPlan: Partial<SubscriptionPlan> = {
        name: "",
        description: "",
        price_monthly: 0,
        price_yearly: null,
        is_active: true,
        is_featured: false,
        is_exclusive: false,
        exclusive_user_id: null,
        max_subscriptions: null,
        sort_order: 0,
        max_transactions: null,
        max_accounts: null,
        max_credit_cards: null,
        max_categories: null,
        max_workspaces: null,
        max_users_per_workspace: null,
        enable_reports: true,
        enable_budgets: true,
        enable_ai_features: true,
        enable_api_access: false,
        enable_export_data: true,
        enable_custom_categories: true,
        enable_multiple_workspaces: true,
        enable_workspace_sharing: true,
      };
      setFormData(newPlan);
      setIsEditing(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First get the plan data
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) {
        console.error('Error fetching plan:', planError);
        showError('Erro ao carregar plano');
        navigate('/admin/plans');
        return;
      }

      // If it's an exclusive plan, get user data
      let planWithUserData = planData;
      if (planData.is_exclusive && planData.exclusive_user_id) {
        try {
          const { data: userData, error: userError } = await supabase.functions.invoke('admin-list-users', {
            body: { userId: planData.exclusive_user_id }
          });

          if (!userError && userData?.users?.length > 0) {
            planWithUserData = {
              ...planData,
              exclusive_user: userData.users[0]
            };
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }

      setPlan(planWithUserData);
      setFormData(planWithUserData);
    } catch (error) {
      console.error('Error in fetchPlan:', error);
      showError('Erro ao carregar plano');
      navigate('/admin/plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const planData = {
        name: formData.name,
        description: formData.description || null,
        price_monthly: formData.price_monthly || 0,
        price_yearly: formData.price_yearly,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        is_exclusive: formData.is_exclusive,
        exclusive_user_id: formData.is_exclusive ? formData.exclusive_user_id : null,
        max_subscriptions: formData.max_subscriptions,
        sort_order: formData.sort_order || 0,
        max_transactions: formData.max_transactions,
        max_accounts: formData.max_accounts,
        max_credit_cards: formData.max_credit_cards,
        max_categories: formData.max_categories,
        max_workspaces: formData.max_workspaces,
        max_users_per_workspace: formData.max_users_per_workspace,
        enable_reports: formData.enable_reports,
        enable_budgets: formData.enable_budgets,
        enable_ai_features: formData.enable_ai_features,
        enable_api_access: formData.enable_api_access,
        enable_export_data: formData.enable_export_data,
        enable_custom_categories: formData.enable_custom_categories,
        enable_multiple_workspaces: formData.enable_multiple_workspaces,
        enable_workspace_sharing: formData.enable_workspace_sharing,
      };

      if (isNewPlan) {
        const { data, error } = await supabase
          .from("subscription_plans")
          .insert(planData)
          .select()
          .single();

        if (error) throw error;
        
        showSuccess("Plano criado com sucesso!");
        navigate(`/admin/plans/${data.id}`);
      } else {
        const { error } = await supabase
          .from("subscription_plans")
          .update(planData)
          .eq("id", planId);

        if (error) throw error;
        
        showSuccess("Plano atualizado com sucesso!");
        setPlan({ ...plan!, ...planData });
        setIsEditing(false);
      }
    } catch (error: any) {
      showError(`Erro ao ${isNewPlan ? 'criar' : 'atualizar'} plano: ` + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', plan.id);

      if (error) throw error;

      showSuccess('Plano excluído com sucesso!');
      navigate('/admin/plans');
    } catch (error: any) {
      showError('Erro ao excluir plano: ' + error.message);
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatLimit = (value: number | null) => {
    return value === null ? 'Ilimitado' : value.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getYearlyDiscount = () => {
    if (!formData.price_yearly || !formData.price_monthly || formData.price_monthly === 0) return 0;
    return Math.round((1 - (formData.price_yearly / (formData.price_monthly * 12))) * 100);
  };

  const getExclusiveUserName = () => {
    if (!plan?.exclusive_user) return null;
    const user = plan.exclusive_user;
    if (user.profiles?.first_name && user.profiles?.last_name) {
      return `${user.profiles.first_name} ${user.profiles.last_name}`;
    }
    if (user.profiles?.first_name) {
      return user.profiles.first_name;
    }
    return user.email.split('@')[0];
  };

  const coreFeatures = PLAN_FEATURES.filter(f => f.category === 'core');
  const optionalFeatures = PLAN_FEATURES.filter(f => f.category === 'optional');

  if (loading) {
    return (
      <>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/plans')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/plans')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
              {isNewPlan ? 'Novo Plano' : formData.name || 'Plano'}
              {formData.is_featured && (
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              )}
              {formData.is_exclusive && (
                <Badge variant="outline" className="gap-1">
                  <UserCheck className="h-3 w-3" />
                  Exclusivo
                </Badge>
              )}
              {!isNewPlan && (
                <Badge variant={formData.is_active ? "default" : "secondary"}>
                  {formData.is_active ? "Ativo" : "Inativo"}
                </Badge>
              )}
            </h1>
            {formData.description && (
              <p className="text-sm text-muted-foreground mt-1">{formData.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isNewPlan && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="ghost" onClick={() => {
                if (isNewPlan) {
                  navigate('/admin/plans');
                } else {
                  setFormData(plan!);
                  setIsEditing(false);
                }
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
          {!isNewPlan && !isEditing && (
            <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
              Excluir
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Plano Premium"
                  />
                ) : (
                  <p className="text-lg font-medium">{formData.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordem de Exibição</Label>
                {isEditing ? (
                  <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={formData.sort_order || 0}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <p className="text-lg font-medium">{formData.sort_order}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva os benefícios e características do plano..."
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground">{formData.description || 'Sem descrição'}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Preço Mensal (R$)</Label>
                {isEditing ? (
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_monthly || 0}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                  />
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(formData.price_monthly || 0)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_yearly">Preço Anual (R$)</Label>
                {isEditing ? (
                  <Input
                    id="price_yearly"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Opcional"
                    value={formData.price_yearly || ""}
                    onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formData.price_yearly ? formatPrice(formData.price_yearly) : 'Não definido'}
                    </p>
                    {getYearlyDiscount() > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        {getYearlyDiscount()}% desconto
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Plano Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Planos inativos não aparecem para os usuários
                  </p>
                </div>
                <Switch
                  checked={formData.is_active || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Plano em Destaque</Label>
                  <p className="text-sm text-muted-foreground">
                    Planos em destaque são destacados visualmente
                  </p>
                </div>
                <Switch
                  checked={formData.is_featured || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Exclusividade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Configurações de Exclusividade
            </CardTitle>
            <CardDescription>
              Configure se este plano é exclusivo para um usuário específico ou tem limite de assinaturas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Plano Exclusivo</Label>
                <p className="text-sm text-muted-foreground">
                  Planos exclusivos só aparecem para o usuário específico
                </p>
              </div>
              <Switch
                checked={formData.is_exclusive || false}
                onCheckedChange={(checked) => {
                  setFormData({ 
                    ...formData, 
                    is_exclusive: checked,
                    exclusive_user_id: checked ? formData.exclusive_user_id : null
                  });
                }}
                disabled={!isEditing}
              />
            </div>

            {formData.is_exclusive && (
              <div className="space-y-2">
                <Label>Usuário Exclusivo</Label>
                {isEditing ? (
                  <UserSearchCombobox
                    value={formData.exclusive_user_id}
                    onValueChange={(userId) => setFormData({ ...formData, exclusive_user_id: userId })}
                    placeholder="Selecione o usuário exclusivo..."
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    {plan?.exclusive_user ? (
                      <>
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium">{getExclusiveUserName()}</p>
                          <p className="text-sm text-muted-foreground">{plan.exclusive_user.email}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Nenhum usuário selecionado</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Este plano só será visível e disponível para o usuário selecionado.
                </p>
              </div>
            )}

            {!formData.is_exclusive && (
              <div className="space-y-2">
                <Label htmlFor="max_subscriptions">Limite de Assinaturas</Label>
                {isEditing ? (
                  <Input
                    id="max_subscriptions"
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={formData.max_subscriptions || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      max_subscriptions: e.target.value ? parseInt(e.target.value) : null 
                    })}
                  />
                ) : (
                  <p className="text-lg font-medium">
                    {formatLimit(formData.max_subscriptions)} assinaturas
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Número máximo de usuários que podem assinar este plano. Deixe vazio para ilimitado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Limites Principais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Limites Principais
            </CardTitle>
            <CardDescription>
              Configure os limites de uso para recursos essenciais. Deixe vazio para ilimitado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures.map((feature) => {
                const value = (formData as any)[feature.key];
                return (
                  <div key={feature.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{feature.label}</Label>
                      {!isEditing && value === null && (
                        <Badge variant="secondary" className="text-xs">
                          <Infinity className="h-3 w-3 mr-1" />
                          Ilimitado
                        </Badge>
                      )}
                    </div>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ilimitado"
                        value={value || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          [feature.key]: e.target.value ? parseInt(e.target.value) : null 
                        })}
                      />
                    ) : (
                      <p className="text-lg font-medium">{formatLimit(value)}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recursos Opcionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recursos Opcionais
            </CardTitle>
            <CardDescription>
              Ative ou desative recursos específicos para este plano.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optionalFeatures.map((feature) => {
                const isEnabled = (formData as any)[feature.key];
                return (
                  <div key={feature.key} className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="mt-0.5">
                      {isEnabled ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium">{feature.label}</Label>
                        <Switch
                          checked={isEnabled || false}
                          onCheckedChange={(checked) => setFormData({ 
                            ...formData, 
                            [feature.key]: checked 
                          })}
                          disabled={!isEditing}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        {!isNewPlan && plan && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID do Plano:</span>
                  <p className="text-muted-foreground font-mono">{plan.id}</p>
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>
                  <p className="text-muted-foreground">
                    {plan.is_exclusive ? 'Plano Exclusivo' : 'Plano Público'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Criado em:</span>
                  <p className="text-muted-foreground">{formatDate(plan.created_at)}</p>
                </div>
                <div>
                  <span className="font-medium">Última atualização:</span>
                  <p className="text-muted-foreground">{formatDate(plan.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <DeletePlanAlert
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        plan={plan}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AdminPlanDetail;