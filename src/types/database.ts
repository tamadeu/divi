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