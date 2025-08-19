import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
}

const IncomeExpenseChart = () => {
  const [data, setData] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlySummary = async () => {
      setLoading(true);
      const { data: rpcData, error } = await supabase.rpc('get_monthly_summary');

      if (error) {
        console.error("Error fetching monthly summary:", error);
        setData([]);
      } else if (rpcData) {
        const formattedData = rpcData.map((item: any) => ({
          month: format(new Date(item.month), "MMM", { locale: ptBR }).replace('.', ''),
          income: item.income,
          expenses: item.expenses,
        }));
        setData(formattedData);
      }
      setLoading(false);
    };

    fetchMonthlySummary();
  }, []);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Renda vs. Despesas</CardTitle>
        <CardDescription>Comparativo dos últimos 6 meses.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Legend />
                <Bar dataKey="income" name="Renda" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Despesas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Não há dados suficientes para exibir o gráfico.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseChart;