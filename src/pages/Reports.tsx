import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import MonthlyChart from "@/components/reports/MonthlyChart";
import CategoryChart from "@/components/reports/CategoryChart";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface CategoryData {
  name: string;
  value: number;
}

const ReportsPage = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace } = useWorkspace();

  const fetchReportsData = async () => {
    if (!currentWorkspace) {
      setMonthlyData([]);
      setCategoryData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch monthly summary data
      const { data: monthlyDataRaw, error: monthlyError } = await supabase.rpc('get_monthly_summary', {
        workspace_id_param: currentWorkspace.id
      });
      
      if (monthlyError) {
        console.error("Error fetching monthly data:", monthlyError);
      } else {
        setMonthlyData(monthlyDataRaw || []);
      }

      // Fetch category spending data
      const { data: categoryDataRaw, error: categoryError } = await supabase.rpc('get_spending_by_category', {
        workspace_id_param: currentWorkspace.id
      });
      
      if (categoryError) {
        console.error("Error fetching category data:", categoryError);
      } else {
        setCategoryData(categoryDataRaw || []);
      }
    } catch (error) {
      console.error("Error fetching reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      fetchReportsData();
    }
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Nenhum núcleo financeiro selecionado</h2>
          <p className="text-muted-foreground">Selecione um núcleo financeiro para ver seus relatórios.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Relatórios</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Despesas (Últimos 6 Meses)</CardTitle>
            <CardDescription>
              Comparação mensal entre suas receitas e despesas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <MonthlyChart data={monthlyData} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria (Mês Atual)</CardTitle>
            <CardDescription>
              Distribuição dos seus gastos por categoria neste mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <CategoryChart data={categoryData} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ReportsPage;