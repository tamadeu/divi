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
  account?: {
    name: string;
    type: string;
  };
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
  status: 'open' | 'closed' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
  credit_card?: CreditCard;
}

export interface CreditCardTransaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  description?: string;
  category?: string;
  credit_card_bill_id: string;
  status: string;
}