export type Transaction = {
  id: string;
  date: string;
  name: string;
  amount: number;
  status: "Completed" | "Pending" | "Failed";
  category: string;
  method: string;
  description: string;
};

export const summaryData = {
  totalBalance: 12540.5,
  monthlyIncome: 5200.0,
  monthlyExpenses: -2345.8,
};

export const allTransactions: Transaction[] = [
  { id: "txn_1", date: "2024-07-29", name: "Starbucks", amount: -12.5, status: "Completed", category: "Food & Drink", method: "Credit Card", description: "Morning coffee" },
  { id: "txn_2", date: "2024-07-29", name: "Salary Deposit", amount: 2600.0, status: "Completed", category: "Income", method: "Direct Deposit", description: "Bi-weekly salary" },
  { id: "txn_3", date: "2024-07-28", name: "Amazon.com", amount: -89.99, status: "Completed", category: "Shopping", method: "Credit Card", description: "Electronics purchase" },
  { id: "txn_4", date: "2024-07-27", name: "Netflix Subscription", amount: -15.49, status: "Pending", category: "Entertainment", method: "Credit Card", description: "Monthly subscription" },
  { id: "txn_5", date: "2024-07-26", name: "Gas Station", amount: -45.3, status: "Completed", category: "Transport", method: "Debit Card", description: "Fuel for car" },
  { id: "txn_6", date: "2024-07-25", name: "Restaurant", amount: -75.0, status: "Completed", category: "Food & Drink", method: "Credit Card", description: "Dinner with friends" },
  { id: "txn_7", date: "2024-07-24", name: "Apple Store", amount: -1200.0, status: "Completed", category: "Shopping", method: "Credit Card", description: "New iPhone" },
  { id: "txn_8", date: "2024-07-23", name: "Gym Membership", amount: -40.0, status: "Completed", category: "Health", method: "Debit Card", description: "Monthly fee" },
  { id: "txn_9", date: "2024-07-22", name: "Utility Bill", amount: -120.0, status: "Completed", category: "Utilities", method: "Bank Transfer", description: "Electricity bill" },
  { id: "txn_10", date: "2024-07-21", name: "Freelance Payment", amount: 500.0, status: "Completed", category: "Income", method: "PayPal", description: "Web design project" },
  { id: "txn_11", date: "2024-07-20", name: "Grocery Store", amount: -150.75, status: "Completed", category: "Groceries", method: "Debit Card", description: "Weekly groceries" },
  { id: "txn_12", date: "2024-07-19", name: "Bank Transfer Fee", amount: -5.0, status: "Failed", category: "Fees", method: "Bank Transfer", description: "Transfer fee" },
];

export const spendingData = [
  { name: "Groceries", value: 400, fill: "hsl(var(--chart-1))" },
  { name: "Utilities", value: 300, fill: "hsl(var(--chart-2))" },
  { name: "Transport", value: 300, fill: "hsl(var(--chart-3))" },
  { name: "Entertainment", value: 200, fill: "hsl(var(--chart-4))" },
  { name: "Health", value: 278, fill: "hsl(var(--chart-5))" },
  { name: "Other", value: 189, fill: "hsl(var(--chart-6))" },
];