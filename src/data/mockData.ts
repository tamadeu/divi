// O tipo Transaction foi movido para src/types/database.ts
// O tipo Account foi movido para src/types/database.ts

export type Budget = {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
};

export type MonthlySummary = {
  month: string;
  income: number;
  expenses: number;
};

export const budgetsData: Budget[] = [
  { id: "bud_1", category: "Alimentação", budgeted: 500, spent: 87.5 },
  { id: "bud_2", category: "Transporte", budgeted: 150, spent: 45.3 },
  { id: "bud_3", category: "Compras", budgeted: 1500, spent: 1289.99 },
  { id: "bud_4", category: "Lazer", budgeted: 200, spent: 15.49 },
  { id: "bud_5", category: "Contas", budgeted: 300, spent: 120 },
  { id: "bud_6", category: "Saúde", budgeted: 100, spent: 40 },
];

export const monthlySummaryData: MonthlySummary[] = [
  { month: "Fev", income: 4800, expenses: -2200 },
  { month: "Mar", income: 5000, expenses: -2500 },
  { month: "Abr", income: 5100, expenses: -2300 },
  { month: "Mai", income: 5300, expenses: -2800 },
  { month: "Jun", income: 5250, expenses: -2600 },
  { month: "Jul", income: 5200, expenses: -2345 },
];