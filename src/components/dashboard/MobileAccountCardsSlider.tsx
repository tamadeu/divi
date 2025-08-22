"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Account } from "@/types/database"; // Import Account type

interface MobileAccountCardsSliderProps {
  accounts: Account[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "Conta Corrente":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "Poupança":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Investimento":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "Cartão de Crédito":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const MobileAccountCardsSlider = ({ accounts }: MobileAccountCardsSliderProps) => {
  if (accounts.length === 0) {
    return (
      <Card className="mb-4">
        <CardContent className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          Nenhuma conta encontrada.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
      <div className="flex space-x-3">
        {accounts.map((account, index) => (
          <Card
            key={account.id}
            className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[60vw] lg:w-[400px] snap-center"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    {account.is_default && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <CardDescription>{account.bank}</CardDescription>
                </div>
                <Badge className={getTypeColor(account.type)}>
                  {account.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${
                  account.balance >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(account.balance)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MobileAccountCardsSlider;