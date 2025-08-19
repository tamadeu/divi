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
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface SpendingData {
  name: string;
  value: number;
  fill: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

const SpendingChart = () => {
  const [data, setData] = useState<SpendingData[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchSpendingData = async () => {
      setLoading(true);
      const { data: rpcData, error } = await supabase.rpc('get_spending_by_category');

      if (error) {
        console.error("Error fetching spending data:", error);
        setData([]);
      } else {
        const formattedData = rpcData.map((entry: any, index: number) => ({
          ...entry,
          fill: COLORS[index % COLORS.length],
        }));
        setData(formattedData);
      }
      setLoading(false);
    };

    fetchSpendingData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por Categoria</CardTitle>
        <CardDescription>Análise de seus gastos no mês atual.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={isMobile ? 80 : 100}
                  innerRadius={isMobile ? 50 : 60}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={isMobile ? false : ({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                />
                {!isMobile && <Legend iconSize={12} />}
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Nenhum dado de gastos para este mês.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendingChart;