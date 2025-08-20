import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionPlan, PLAN_FEATURES } from "@/types/subscription-plans";
import { 
  Check, 
  X, 
  Infinity, 
  Star, 
  Calendar, 
  DollarSign,
  Settings,
  Zap
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PlanDetailsModalProps {
  plan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

const PlanDetailsModal = ({ plan, isOpen, onClose }: PlanDetailsModalProps) => {
  if (!plan) return null;

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
    if (!plan.price_yearly || plan.price_monthly === 0) return 0;
    return Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100);
  };

  const coreFeatures = PLAN_FEATURES.filter(f => f.category === 'core');
  const optionalFeatures = PLAN_FEATURES.filter(f => f.category === 'optional');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {plan.name}
            {plan.is_featured && (
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
            )}
            <Badge variant={plan.is_active ? "default" : "secondary"}>
              {plan.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.description && (
                <div>
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Preço Mensal</h4>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(plan.price_monthly)}
                  </p>
                </div>

                {plan.price_yearly && (
                  <div>
                    <h4 className="font-medium mb-2">Preço Anual</h4>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(plan.price_yearly)}
                    </p>
                    {getYearlyDiscount() > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        {getYearlyDiscount()}% desconto
                      </Badge>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Ordem de Exibição</h4>
                  <p className="text-2xl font-bold">{plan.sort_order}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Destaque:</span>
                  <Badge variant={plan.is_featured ? "default" : "secondary"}>
                    {plan.is_featured ? "Sim" : "Não"}
                  </Badge>
                </div>
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
                Limites de uso para recursos essenciais da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coreFeatures.map((feature) => {
                  const value = (plan as any)[feature.key];
                  return (
                    <div key={feature.key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{feature.label}</h4>
                        {value === null ? (
                          <Badge variant="secondary" className="text-xs">
                            <Infinity className="h-3 w-3 mr-1" />
                            Ilimitado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {formatLimit(value)}
                          </Badge>
                        )}
                      </div>
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
                Recursos que podem ser ativados ou desativados neste plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optionalFeatures.map((feature) => {
                  const isEnabled = (plan as any)[feature.key];
                  return (
                    <div key={feature.key} className="flex items-start gap-3 border rounded-lg p-3">
                      <div className="mt-0.5">
                        {isEnabled ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{feature.label}</h4>
                          <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                            {isEnabled ? "Ativo" : "Inativo"}
                          </Badge>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanDetailsModal;