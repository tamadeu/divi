import { Database } from "./supabase";

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type Account = Tables<'accounts'>;
export type Category = Tables<'categories'>;
export type Transaction = Tables<'transactions'> & {
  category?: string; // Joined from categories table
  account?: Account; // Joined from accounts table
  installment_number?: number; // New: Current installment number
  total_installments?: number; // New: Total number of installments
};
export type Company = Tables<'companies'>;
export type CreditCard = Tables<'credit_cards'>;
export type CreditCardBill = Tables<'credit_card_bills'>;
export type Profile = Tables<'profiles'>;
export type SubscriptionPlan = Tables<'subscription_plans'>;
export type Workspace = Tables<'workspaces'>;
export type WorkspaceUser = Tables<'workspace_users'>;
export type AiRequestLog = Tables<'ai_request_logs'>;