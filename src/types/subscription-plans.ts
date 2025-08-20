export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_exclusive: boolean;
  exclusive_user_id: string | null;
  max_subscriptions: number | null;
  sort_order: number;
  
  // Core limits (always enabled)
  max_transactions: number | null; // null means unlimited
  max_accounts: number | null;
  max_credit_cards: number | null;
  max_categories: number | null;
  max_workspaces: number | null;
  max_users_per_workspace: number | null;
  
  // Optional features (can be disabled)
  enable_reports: boolean;
  enable_budgets: boolean;
  enable_ai_features: boolean;
  enable_api_access: boolean;
  enable_export_data: boolean;
  enable_custom_categories: boolean;
  enable_multiple_workspaces: boolean;
  enable_workspace_sharing: boolean;
  
  // Additional features
  features: any[] | null;
  
  created_at: string;
  updated_at: string;
  
  // Relations for exclusive plans
  exclusive_user?: {
    id: string;
    email: string;
    profiles?: {
      first_name: string | null;
      last_name: string | null;
    };
  };
}

export interface PlanFormData {
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_exclusive: boolean;
  exclusive_user_id: string | null;
  max_subscriptions: number | null;
  sort_order: number;
  
  // Core limits
  max_transactions: number | null;
  max_accounts: number | null;
  max_credit_cards: number | null;
  max_categories: number | null;
  max_workspaces: number | null;
  max_users_per_workspace: number | null;
  
  // Optional features
  enable_reports: boolean;
  enable_budgets: boolean;
  enable_ai_features: boolean;
  enable_api_access: boolean;
  enable_export_data: boolean;
  enable_custom_categories: boolean;
  enable_multiple_workspaces: boolean;
  enable_workspace_sharing: boolean;
}

export interface PlanFeature {
  key: string;
  label: string;
  description: string;
  type: 'limit' | 'feature';
  category: 'core' | 'optional';
  alwaysEnabled?: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  // Core limits (always enabled)
  {
    key: 'max_transactions',
    label: 'Transações por mês',
    description: 'Número máximo de transações que podem ser criadas por mês',
    type: 'limit',
    category: 'core',
    alwaysEnabled: true
  },
  {
    key: 'max_accounts',
    label: 'Contas bancárias',
    description: 'Número máximo de contas bancárias que podem ser cadastradas',
    type: 'limit',
    category: 'core',
    alwaysEnabled: true
  },
  {
    key: 'max_credit_cards',
    label: 'Cartões de crédito',
    description: 'Número máximo de cartões de crédito que podem ser cadastrados',
    type: 'limit',
    category: 'core',
    alwaysEnabled: true
  },
  {
    key: 'max_categories',
    label: 'Categorias',
    description: 'Número máximo de categorias que podem ser criadas',
    type: 'limit',
    category: 'core',
    alwaysEnabled: true
  },
  {
    key: 'max_workspaces',
    label: 'Workspaces',
    description: 'Número máximo de workspaces que podem ser criados',
    type: 'limit',
    category: 'core',
    alwaysEnabled: true
  },
  {
    key: 'max_users_per_workspace',
    label: 'Usuários por workspace',
    description: 'Número máximo de usuários que podem ser adicionados a cada workspace',
    type: 'limit',
    category: 'core',
    alwaysEnabled: true
  },
  
  // Optional features
  {
    key: 'enable_reports',
    label: 'Relatórios avançados',
    description: 'Acesso a relatórios detalhados e análises financeiras',
    type: 'feature',
    category: 'optional'
  },
  {
    key: 'enable_budgets',
    label: 'Orçamentos',
    description: 'Criação e acompanhamento de orçamentos mensais',
    type: 'feature',
    category: 'optional'
  },
  {
    key: 'enable_ai_features',
    label: 'Recursos de IA',
    description: 'Categorização automática e insights inteligentes',
    type: 'feature',
    category: 'optional'
  },
  {
    key: 'enable_api_access',
    label: 'Acesso à API',
    description: 'Integração com sistemas externos via API REST',
    type: 'feature',
    category: 'optional'
  },
  {
    key: 'enable_export_data',
    label: 'Exportação de dados',
    description: 'Exportar dados em diversos formatos (CSV, Excel, PDF)',
    type: 'feature',
    category: 'optional'
  },
  {
    key: 'enable_custom_categories',
    label: 'Categorias personalizadas',
    description: 'Criar e personalizar categorias próprias',
    type: 'feature',
    category: 'optional'
  },
  {
    key: 'enable_multiple_workspaces',
    label: 'Múltiplos workspaces',
    description: 'Criar e gerenciar múltiplos workspaces',
    type: 'feature',
    category: 'optional'
  },
  {
    key: 'enable_workspace_sharing',
    label: 'Compartilhamento de workspace',
    description: 'Compartilhar workspaces com outros usuários',
    type: 'feature',
    category: 'optional'
  }
];