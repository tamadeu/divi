"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface MonthlyChartProps {
  data: MonthlyData[];
}

const MonthlyChart = ({ data }: MonthlyChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMonth = (dateString: string) => {
    try {
      const date = new Date(dateString + '-01');
      return format(date, 'MMM/yy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const chartData = data.map(item => ({
    ...item,
    month: formatMonth(item.month),
    income: Number(item.income),
    expenses: Number(item.expenses),
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p>Nenhum dado disponível para o período selecionado.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), '']}
          labelFormatter={(label) => `Mês: ${label}`}
        />
        <Legend />
        <Bar dataKey="income" fill="#22c55e" name="Receitas" />
        <Bar dataKey="expenses" fill="#ef4444" name="Despesas" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyChart;