import { Database } from "./supabase"; // Assuming Database type is generated from Supabase schema

// Extend the base Transaction type from Supabase generated types
export type TransactionWithDetails = Database['public']['Tables']['transactions']['Row'] & {
  // Account details (if account_id is present)
  account_name?: string | null;
  account_type?: string | null;
  account_bank?: string | null;
  account_is_default?: boolean | null;
  account_include_in_total?: boolean | null;

  // Category details (if category_id is present)
  category_name?: string | null;
  category_type?: string | null;
  parent_category_name?: string | null; // Added for subcategories

  // Credit Card Bill details (if credit_card_bill_id is present)
  cc_bill_reference_month?: string | null; // Date string 'YYYY-MM-DD'
  cc_bill_closing_date?: string | null; // Date string 'YYYY-MM-DD'
  cc_bill_due_date?: string | null; // Date string 'YYYY-MM-DD'
  cc_bill_total_amount?: number | null;
  cc_bill_paid_amount?: number | null;
  cc_bill_status?: string | null;

  // Credit Card details (if credit_card_bill_id is present and links to a credit card)
  cc_id?: string | null;
  cc_name?: string | null;
  cc_brand?: string | null;
  cc_last_four_digits?: string | null;
  cc_credit_limit?: number | null;
  cc_closing_day?: number | null;
  cc_due_day?: number | null;
};