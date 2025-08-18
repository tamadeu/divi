export type Transaction = {
  id: string;
  accountId: string;
  date: string;
  name: string;
  amount: number;
  status: "Concluído" | "Pendente" | "Falhou";
  category: string;
  method: string;
  description: string;
};

export type Account = {
  id: string;
  name: string;
  bank: string;
  type: "Conta Corrente" | "Poupança" | "Cartão de Crédito";
  balance: number;
};

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

export const summaryData = {
  totalBalance: 12540.5,
  monthlyIncome: 5200.0,
  monthlyExpenses: -2345.8,
};

export const allTransactions: Transaction[] = [
  { id: "txn_1", accountId: "acc_2", date: "2024-07-29", name: "Starbucks", amount: -12.5, status: "Concluído", category: "Alimentação", method: "Cartão de Crédito", description: "Café da manhã" },
  { id: "txn_2", accountId: "acc_1", date: "2024-07-29", name: "Depósito de Salário", amount: 2600.0, status: "Concluído", category: "Renda", method: "Depósito Direto", description: "Salário quinzenal" },
  { id: "txn_3", accountId: "acc_2", date: "2024-07-28", name: "Amazon.com.br", amount: -89.99, status: "Concluído", category: "Compras", method: "Cartão de Crédito", description: "Compra de eletrônicos" },
  { id: "txn_4", accountId: "acc_2", date: "2024-07-27", name: "Assinatura Netflix", amount: -15.49, status: "Pendente", category: "Lazer", method: "Cartão de Crédito", description: "Assinatura mensal" },
  { id: "txn_5", accountId: "acc_1", date: "2024-07-26", name: "Posto de Gasolina", amount: -45.3, status: "Concluído", category: "Transporte", method: "Cartão de Débito", description: "Combustível para o carro" },
  { id: "txn_6", accountId: "acc_2", date: "2024-07-25", name: "Restaurante", amount: -75.0, status: "Concluído", category: "Alimentação", method: "Cartão de Crédito", description: "Jantar com amigos" },
  { id: "txn_7", accountId: "acc_2", date: "2024-07-24", name: "Apple Store", amount: -1200.0, status: "Concluído", category: "Compras", method: "Cartão de Crédito", description: "Novo iPhone" },
  { id: "txn_8", accountId: "acc_1", date: "2024-07-23", name: "Mensalidade Academia", amount: -40.0, status: "Concluído", category: "Saúde", method: "Cartão de Débito", description: "Taxa mensal" },
  { id: "txn_9", accountId: "acc_1", date: "2024-07-22", name: "Conta de Luz", amount: -120.0, status: "Concluído", category: "Contas", method: "Transferência Bancária", description: "Conta de eletricidade" },
  { id: "txn_10", accountId: "acc_1", date: "2024-07-21", name: "Pagamento Freelance", amount: 500.0, status: "Concluído", category: "Renda", method: "PayPal", description: "Projeto de web design" },
  { id: "txn_11", accountId: "acc_1", date: "2024-07-20", name: "Supermercado", amount: -150.75, status: "Concluído", category: "Supermercado", method: "Cartão de Débito", description: "Compras da semana" },
  { id: "txn_12", accountId: "acc_3", date: "2024-07-19", name: "Taxa de Transferência", amount: -5.0, status: "Falhou", category: "Taxas", method: "Transferência Bancária", description: "Taxa de transferência" },
];

export const spendingData = [
  { name: "Supermercado", value: 400, fill: "hsl(var(--chart-1))" },
  { name: "Contas", value: 300, fill: "hsl(var(--chart-2))" },
  { name: "Transporte", value: 300, fill: "hsl(var(--chart-3))" },
  { name: "Lazer", value: 200, fill: "hsl(var(--chart-4))" },
  { name: "Saúde", value: 278, fill: "hsl(var(--chart-5))" },
  { name: "Outros", value: 189, fill: "hsl(var(--chart-6))" },
];

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