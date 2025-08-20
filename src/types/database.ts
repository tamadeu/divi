import { Database } from "./supabase";

export type Account = Database['public']['Tables']['accounts']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Company = Database['public']['Tables']['companies']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Workspace = Database['public']['Tables']['workspaces']['Row'];
export type WorkspaceUser = Database['public']['Tables']['workspace_users']['Row'];

export type CreditCard = Database['public']['Tables']['credit_cards']['Row'];
export type CreditCardBill = Database['public']['Tables']['credit_card_bills']['Row'];

// Extend Transaction type to include joined data
export type TransactionWithDetails = Transaction & {
  category?: { name: string } | null;
  account?: { name: string; type: string } | null;
};

// Extend CreditCard type to include joined account data
export type CreditCardWithAccount = CreditCard & {
  account?: { name: string; type: string; balance: number } | null;
};