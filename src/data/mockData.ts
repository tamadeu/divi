// O tipo Transaction foi movido para src/types/database.ts
// O tipo Account foi movido para src/types/database.ts

export type MonthlySummary = {
  month: string;
  income: number;
  expenses: number;
};

export const monthlySummaryData: MonthlySummary[] = [
  { month: "Fev", income: 4800, expenses: -2200 },
  { month: "Mar", income: 5000, expenses: -2500 },
  { month: "Abr", income: 5100, expenses: -2300 },
  { month: "Mai", income: 5300, expenses: -2800 },
  { month: "Jun", income: 5250, expenses: -2600 },
  { month: "Jul", income: 5200, expenses: -2345 },
];