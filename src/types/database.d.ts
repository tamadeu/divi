// This file will contain shared database-related types.

export interface Account {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  bank_id: string | null;
  type: string;
  balance: number;
  created_at: string;
  is_default: boolean;
  include_in_total: boolean;
  workspace_id: string | null;
}

export interface Bank {
  id: string;
  name: string;
  logo_url: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: string;
  created_at: string;
  workspace_id: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  date: string;
  name: string;
  amount: number;
  description: string | null;
  created_at: string;
  account_id: string | null;
  status: "Concluído" | "Pendente" | "Falhou";
  transfer_id: string | null;
  workspace_id: string | null;
  credit_card_bill_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
}

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string;
  created_at: string;
  workspace_id: string | null;
}

export interface BudgetWithSpending extends Budget {
  category_name: string;
  budgeted_amount: number;
  spent_amount: number;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_shared: boolean | null;
  created_at: string;
  updated_at: string;
  workspace_owner: string;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string;
  ai_provider: string | null;
  user_type: string | null;
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
  status: "open" | "paid" | "overdue";
  created_at: string;
  updated_at: string;
  credit_card?: { // Nested credit card details
    name: string;
    brand: string;
    last_four_digits: string;
  };
}