"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MobileIncomeExpenseSummaryCardsProps {
  monthlyIncome: number;
  monthlyExpenses: number;
}

const MobileIncomeExpenseSummaryCards = ({ monthlyIncome, monthlyExpenses }: MobileIncomeExpenseSummaryCardsProps) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-green-100 text-xs font-medium">Renda</p>
              <p className="text-sm font-bold truncate">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div className="bg-white/20 p-1.5 rounded-full ml-2">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-red-100 text-xs font-medium">Despesas</p>
              <p className="text-sm font-bold truncate">{formatCurrency(Math.abs(monthlyExpenses))}</p>
            </div>
            <div className="bg-white/20 p-1.5 rounded-full ml-2">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileIncomeExpenseSummaryCards;