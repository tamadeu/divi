import { Transaction, Category, Account, CreditCard, CreditCardBill } from './database';

// Define types for nested credit card and bill details
export interface CreditCardDetails {
  id: string;
  name: string;
  brand: string;
  last_four_digits: string;
}

export interface CreditCardBillDetails {
  id: string;
  reference_month: string;
  closing_date: string;
  due_date: string;
  status: string;
  credit_card: CreditCardDetails;
}

// Extend the base Transaction type with detailed nested objects
export interface TransactionWithDetails extends Transaction {
  category?: { name: string } | null;
  account?: { name: string; type: string } | null;
  credit_card_bill?: CreditCardBillDetails | null;
}