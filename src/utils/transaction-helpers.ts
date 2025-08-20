import { Company } from "@/types/database";

export const getCompanyLogo = (transactionName: string, companies: Company[]): string | null => {
  if (!transactionName || !companies.length) return null;
  
  const company = companies.find(c => 
    transactionName.toLowerCase().includes(c.name.toLowerCase())
  );
  
  return company?.logo_url || null;
};

export const formatTransactionAmount = (amount: number): string => {
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const getTransactionType = (amount: number): "income" | "expense" => {
  return amount > 0 ? "income" : "expense";
};

export const isTransferTransaction = (transactionName: string): boolean => {
  return transactionName.toLowerCase().startsWith('transferência');
};