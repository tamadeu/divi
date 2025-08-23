import { Database } from "./supabase";

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type Account = Tables<'accounts'>;
export type Category = Tables<'categories'> & {
  parent_category_id?: string | null; // Added for subcategories, now explicitly nullable
};
export type Transaction = Tables<'transactions'> & {
  category?: string; // Joined from categories table
  account?: Account; // Joined from accounts table
  installment_number?: number | null; // New: Current installment number, explicitly nullable
  total_installments?: number | null; // New: Total number of installments, explicitly nullable
};
export type Company = Tables<'companies'>;
export type CreditCard = Tables<'credit_cards'>;
export type CreditCardBill = Tables<'credit_card_bills'>;
export type Profile = Tables<'profiles'>;
export type SubscriptionPlan = Tables<'subscription_plans'>;
export type Workspace = Tables<'workspaces'>;
export type WorkspaceUser = Tables<'workspace_users'>;
export type AiRequestLog = Tables<'ai_request_logs'>;