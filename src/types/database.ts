export interface Account {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  type: string;
  balance: number;
  is_default: boolean;
  include_in_total: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id?: string;
  category?: string;
  date: string;
  name: string;
  amount: number;
  description?: string;
  account_id?: string;
  account?: string;
  status: "Concluído" | "Pendente" | "Falhou";
  transfer_id?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string;
  created_at: string;
}

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  ai_provider?: string;
  user_type?: string;
  updated_at: string;
}

export interface Bank {
  id: string;
  name: string;
  logo_url?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}