export interface User {
  id: string;
  email: string;
  created_at: string;
  profile?: Profile;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  user_type: string | null;
  ai_provider: string | null;
  updated_at: string | null;
}

export interface Bank {
  id: string;
  name: string;
  logo_url: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  is_active: boolean;
  is_featured: boolean;
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
}

export interface Account {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  bank: string;
  type: string;
  balance: number;
  is_default: boolean;
  include_in_total: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  workspace_id: string | null;
  account_id: string | null;
  category_id: string | null;
  credit_card_bill_id: string | null;
  date: string;
  name: string;
  amount: number;
  description: string | null;
  status: string;
  transfer_id: string | null;
  created_at: string;
  account?: Account;
  category?: Category;
}

export interface Category {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  type: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  workspace_id: string | null;
  category_id: string;
  amount: number;
  month: string;
  created_at: string;
  category?: Category;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  workspace_owner: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceUser {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  is_ghost_user: boolean;
  ghost_user_name: string | null;
  ghost_user_email: string | null;
}

export interface CreditCard {
  id: string;
  workspace_id: string;
  user_id: string;
  account_id: string;
  name: string;
  brand: string;
  last_four_digits: string;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  account?: Account;
}

export interface CreditCardBill {
  id: string;
  workspace_id: string;
  user_id: string;
  credit_card_id: string;
  reference_month: string;
  closing_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  credit_card?: CreditCard;
}