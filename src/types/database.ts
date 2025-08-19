export type Account = {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  type: string;
  balance: number;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  created_at: string;
};

// Representa uma transação com o nome da categoria já incluído (via JOIN)
export type Transaction = {
  id: string;
  account_id: string;
  date: string;
  name: string;
  amount: number;
  status: "Concluído" | "Pendente" | "Falhou";
  description: string | null;
  category: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string; // date string
  created_at: string;
};

export type BudgetWithSpending = {
  id: string;
  category_id: string;
  category_name: string;
  budgeted_amount: number;
  spent_amount: number;
};