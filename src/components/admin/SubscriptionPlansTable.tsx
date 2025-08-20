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
import { SubscriptionPlan } from "@/types/subscription-plans";
import { Pencil, Trash2, Star, Eye, ArrowUp, ArrowDown, ExternalLink, UserCheck, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";

interface SubscriptionPlansTableProps {
  plans: SubscriptionPlan[];
  onDelete: (plan: SubscriptionPlan) => void;
  onToggleActive: (plan: SubscriptionPlan) => void;
  onToggleFeatured: (plan: SubscriptionPlan) => void;
  onMoveUp: (plan: SubscriptionPlan) => void;
  onMoveDown: (plan: SubscriptionPlan) => void;
  loading?: boolean;
}

const SubscriptionPlansTable = ({ 
  plans, 
  onDelete, 
  onToggleActive,
  onToggleFeatured,
  onMoveUp,
  onMoveDown,
  loading 
}: SubscriptionPlansTableProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatLimit = (value: number | null) => {
    return value === null ? 'Ilimitado' : value.toString();
  };

  const getFeatureCount = (plan: SubscriptionPlan) => {
    const features = [
      plan.enable_reports,
      plan.enable_budgets,
      plan.enable_ai_features,
      plan.enable_api_access,
      plan.enable_export_data,
      plan.enable_custom_categories,
      plan.enable_multiple_workspaces,
      plan.enable_workspace_sharing
    ];
    return features.filter(Boolean).length;
  };

  const getExclusiveUserName = (plan: SubscriptionPlan) => {
    if (!plan.exclusive_user) return null;
    const user = plan.exclusive_user;
    if (user.profiles?.first_name && user.profiles?.last_name) {
      return `${user.profiles.first_name} ${user.profiles.last_name}`;
    }
    if (user.profiles?.first_name) {
      return user.profiles.first_name;
    }
    return user.email.split('@')[0];
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ordem</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Preço Mensal</TableHead>
            <TableHead>Preço Anual</TableHead>
            <TableHead>Limites Principais</TableHead>
            <TableHead>Recursos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Destaque</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.length > 0 ? (
            plans.map((plan, index) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{plan.sort_order}</span>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onMoveUp(plan)}
                        disabled={loading || index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onMoveDown(plan)}
                        disabled={loading || index === plans.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <Link 
                      to={`/admin/plans/${plan.id}`}
                      className="font-medium hover:underline flex items-center gap-2"
                    >
                      {plan.name}
                      {plan.is_featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                    {plan.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {plan.description.length > 50 
                          ? `${plan.description.substring(0, 50)}...`
                          : plan.description
                        }
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {plan.is_exclusive ? (
                      <Badge variant="outline" className="gap-1">
                        <UserCheck className="h-3 w-3" />
                        Exclusivo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        Público
                      </Badge>
                    )}
                    {plan.is_exclusive && plan.exclusive_user && (
                      <div className="text-xs text-muted-foreground">
                        {getExclusiveUserName(plan)}
                      </div>
                    )}
                    {!plan.is_exclusive && plan.max_subscriptions && (
                      <div className="text-xs text-muted-foreground">
                        Máx: {plan.max_subscriptions} usuários
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {formatPrice(plan.price_monthly)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {plan.price_yearly ? formatPrice(plan.price_yearly) : '-'}
                  </div>
                  {plan.price_yearly && plan.price_monthly > 0 && (
                    <div className="text-xs text-green-600">
                      {Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}% desconto
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    <div>Transações: {formatLimit(plan.max_transactions)}</div>
                    <div>Contas: {formatLimit(plan.max_accounts)}</div>
                    <div>Workspaces: {formatLimit(plan.max_workspaces)}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getFeatureCount(plan)} recursos ativos
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.is_active}
                      onCheckedChange={() => onToggleActive(plan)}
                      disabled={loading}
                    />
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.is_featured}
                      onCheckedChange={() => onToggleFeatured(plan)}
                      disabled={loading}
                    />
                    {plan.is_featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      asChild
                      disabled={loading}
                    >
                      <Link to={`/admin/plans/${plan.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(plan)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                Nenhum plano encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubscriptionPlansTable;