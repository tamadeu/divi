import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction } from "@/types/database";
import { cn } from "@/lib/utils";

interface TransactionCardListProps {
  transactions: Transaction[];
  loading: boolean;
}

const TransactionCardList = ({ transactions, loading }: TransactionCardListProps) => {
  const statusVariant = {
    "Concluído": "default",
    "Pendente": "secondary",
    "Falhou": "destructive",
  } as const;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        Nenhuma transação recente.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card key={transaction.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{transaction.name}</h3>
              <Badge variant={statusVariant[transaction.status]}>
                {transaction.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{new Date(transaction.date).toLocaleDateString("pt-BR")}</span>
              <span className={cn(
                "font-bold",
                transaction.amount > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(transaction.amount)}
              </span>
            </div>
            {transaction.category && (
              <div className="text-sm text-muted-foreground mt-1">
                Categoria: {typeof transaction.category === 'string' ? transaction.category : transaction.category.name}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TransactionCardList;