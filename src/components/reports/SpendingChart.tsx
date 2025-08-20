import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface SpendingData {
  name: string;
  value: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1919",
];

const SpendingChart = () => {
  const [data, setData] = useState<SpendingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpendingData = async () => {
      setLoading(true);
      const { data: rpcData, error } = await supabase.rpc('get_spending_by_category');

      if (error) {
        console.error("Error fetching spending by category:", error);
        setData([]);
      } else if (rpcData) {
        setData(rpcData);
      }
      setLoading(false);
    };

    fetchSpendingData();
  }, []);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <div className="h-[350px] w-full">
      {loading ? (
        <Skeleton className="h-full w-full" />
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Não há dados suficientes para exibir o gráfico de gastos.
        </div>
      )}
    </div>
  );
};

export default SpendingChart;