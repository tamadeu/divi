"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { showError, showSuccess } from "@/utils/toast";
import { SubscriptionPlan, PLAN_FEATURES } from "@/types/subscription-plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Infinity, Zap, Settings } from "lucide-react";

const planSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  description: z.string().optional(),
  price_monthly: z.number().min(0, "O preço deve ser maior ou igual a zero."),
  price_yearly: z.number().nullable().optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  sort_order: z.number().min(0),
  
  // Core limits
  max_transactions: z.number().nullable().optional(),
  max_accounts: z.number().nullable().optional(),
  max_credit_cards: z.number().nullable().optional(),
  max_categories: z.number().nullable().optional(),
  max_workspaces: z.number().nullable().optional(),
  max_users_per_workspace: z.number().nullable().optional(),
  
  // Optional features
  enable_reports: z.boolean(),
  enable_budgets: z.boolean(),
  enable_ai_features: z.boolean(),
  enable_api_access: z.boolean(),
  enable_export_data: z.boolean(),
  enable_custom_categories: z.boolean(),
  enable_multiple_workspaces: z.boolean(),
  enable_workspace_sharing: z.boolean(),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface AddEditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSaved: () => void;
  plan?: SubscriptionPlan | null;
}

const AddEditPlanModal = ({ isOpen, onClose, onPlanSaved, plan }: AddEditPlanModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!plan;

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      price_monthly: 0,
      price_yearly: null,
      is_active: true,
      is_featured: false,
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
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        form.reset({
          name: plan.name,
          description: plan.description || "",
          price_monthly: plan.price_monthly,
          price_yearly: plan.price_yearly,
          is_active: plan.is_active,
          is_featured: plan.is_featured,
          sort_order: plan.sort_order,
          max_transactions: plan.max_transactions,
          max_accounts: plan.max_accounts,
          max_credit_cards: plan.max_credit_cards,
          max_categories: plan.max_categories,
          max_workspaces: plan.max_workspaces,
          max_users_per_workspace: plan.max_users_per_workspace,
          enable_reports: plan.enable_reports,
          enable_budgets: plan.enable_budgets,
          enable_ai_features: plan.enable_ai_features,
          enable_api_access: plan.enable_api_access,
          enable_export_data: plan.enable_export_data,
          enable_custom_categories: plan.enable_custom_categories,
          enable_multiple_workspaces: plan.enable_multiple_workspaces,
          enable_workspace_sharing: plan.enable_workspace_sharing,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          price_monthly: 0,
          price_yearly: null,
          is_active: true,
          is_featured: false,
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
        });
      }
    }
  }, [isOpen, plan, form]);

  const handleSubmit = async (values: PlanFormValues) => {
    setIsSubmitting(true);

    try {
      const planData = {
        name: values.name,
        description: values.description || null,
        price_monthly: values.price_monthly,
        price_yearly: values.price_yearly,
        is_active: values.is_active,
        is_featured: values.is_featured,
        sort_order: values.sort_order,
        max_transactions: values.max_transactions,
        max_accounts: values.max_accounts,
        max_credit_cards: values.max_credit_cards,
        max_categories: values.max_categories,
        max_workspaces: values.max_workspaces,
        max_users_per_workspace: values.max_users_per_workspace,
        enable_reports: values.enable_reports,
        enable_budgets: values.enable_budgets,
        enable_ai_features: values.enable_ai_features,
        enable_api_access: values.enable_api_access,
        enable_export_data: values.enable_export_data,
        enable_custom_categories: values.enable_custom_categories,
        enable_multiple_workspaces: values.enable_multiple_workspaces,
        enable_workspace_sharing: values.enable_workspace_sharing,
      };

      if (isEditing && plan) {
        const { error } = await supabase
          .from("subscription_plans")
          .update(planData)
          .eq("id", plan.id);

        if (error) throw error;
        showSuccess("Plano atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("subscription_plans")
          .insert(planData);

        if (error) throw error;
        showSuccess("Plano criado com sucesso!");
      }

      onPlanSaved();
      onClose();
    } catch (error: any) {
      showError(`Erro ao ${isEditing ? 'atualizar' : 'criar'} plano: ` + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLimit = (value: number | null) => {
    return value === null ? 'Ilimitado' : value.toString();
  };

  const coreFeatures = PLAN_FEATURES.filter(f => f.category === 'core');
  const optionalFeatures = PLAN_FEATURES.filter(f => f.category === 'optional');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Plano' : 'Criar Novo Plano'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações e recursos do plano de assinatura.' 
              : 'Configure um novo plano de assinatura com recursos personalizados.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Plano</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Plano Premium" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem de Exibição</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva os benefícios e características do plano..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price_monthly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Mensal (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_yearly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Anual (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="Opcional"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Deixe vazio se não houver preço anual
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-6">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Plano Ativo</FormLabel>
                          <FormDescription>
                            Planos inativos não aparecem para os usuários
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Plano em Destaque</FormLabel>
                          <FormDescription>
                            Planos em destaque são destacados visualmente
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coreFeatures.map((feature) => (
                    <FormField
                      key={feature.key}
                      control={form.control}
                      name={feature.key as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            {feature.label}
                            {field.value === null && (
                              <Badge variant="secondary" className="text-xs">
                                <Infinity className="h-3 w-3 mr-1" />
                                Ilimitado
                              </Badge>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              placeholder="Ilimitado"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {feature.description}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
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
                  {optionalFeatures.map((feature) => (
                    <FormField
                      key={feature.key}
                      control={form.control}
                      name={feature.key as any}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{feature.label}</FormLabel>
                            <FormDescription className="text-xs">
                              {feature.description}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  isEditing ? "Salvando..." : "Criando..."
                ) : (
                  isEditing ? "Salvar Alterações" : "Criar Plano"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditPlanModal;