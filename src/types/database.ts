// src/types/database.ts
import { Database } from "./supabase";

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type Account = Tables<'accounts'>;
export type Category = Tables<'categories'>;
export type Transaction = Tables<'transactions'> & {
  category?: { name: string } | string; // Allow for nested object or direct string
  account?: { name: string; type: string } | null;
};
export type Profile = Tables<'profiles'>;

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}