export type Transaction = {
  id: string;
  date: string;
  name: string;
  amount: number;
  status: "Completed" | "Pending" | "Failed";
};

export const summaryData = {
  totalBalance: 12540.5,
  monthlyIncome: 5200.0,
  monthlyExpenses: -2345.8,
};

export const recentTransactions: Transaction[] = [
  { id: "txn_1", date: "2024-07-29", name: "Starbucks", amount: -12.5, status: "Completed" },
  { id: "txn_2", date: "2024-07-29", name: "Salary Deposit", amount: 2600.0, status: "Completed" },
  { id: "txn_3", date: "2024-07-28", name: "Amazon.com", amount: -89.99, status: "Completed" },
  { id: "txn_4", date: "2024-07-27", name: "Netflix Subscription", amount: -15.49, status: "Pending" },
  { id: "txn_5", date: "2024-07-26", name: "Gas Station", amount: -45.3, status: "Completed" },
  { id: "txn_6", date: "2024-07-25", name: "Restaurant", amount: -75.0, status: "Completed" },
];

export const spendingData = [
  { name: "Groceries", value: 400, fill: "hsl(var(--chart-1))" },
  { name: "Utilities", value: 300, fill: "hsl(var(--chart-2))" },
  { name: "Transport", value: 300, fill: "hsl(var(--chart-3))" },
  { name: "Entertainment", value: 200, fill: "hsl(var(--chart-4))" },
  { name: "Health", value: 278, fill: "hsl(var(--chart-5))" },
  { name: "Other", value: 189, fill: "hsl(var(--chart-6))" },
];