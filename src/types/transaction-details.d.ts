import { Transaction, CreditCardBill, CreditCard } from "./database";

// Extend the base Transaction type with details from joined tables
export interface TransactionWithDetails extends Transaction {
  category: string; // Category name
  credit_card_bill?: (CreditCardBill & {
    credit_card?: Pick<CreditCard, 'name' | 'brand' | 'last_four_digits'>;
  }) | null;
}