export interface User {
  id: string;
  email: string;
  created_at: string;
  profile?: Profile | null;
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

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  account_id: string | null;
  workspace_id: string | null;
  date: string;
  name: string;
  amount: number;
  description: string | null;
  status: string;
  transfer_id: string | null;
  credit_card_bill_id: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  type: string;
  created_at: string;
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

export interface Budget {
  id: string;
  user_id: string;
  workspace_id: string | null;
  category_id: string;
  amount: number;
  month: string;
  created_at: string;
}

export interface BudgetWithSpending extends Budget {
  category_name: string;
  spent_amount: number;
}

export interface CreditCard {
  id: string;
  user_id: string;
  workspace_id: string;
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
}

export interface CreditCardBill {
  id: string;
  user_id: string;
  workspace_id: string;
  credit_card_id: string;
  reference_month: string;
  closing_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: 'open' | 'closed' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
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