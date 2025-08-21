import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction, Company } from "@/types/database";
import { TransactionWithDetails } from "@/types/transaction-details"; // Import new type
import TransactionCardList from "@/components/transactions/TransactionCardList";

interface RecentTransactionsProps {
  transactions: TransactionWithDetails[]; // Use new type
  loading: boolean;
  onRowClick?: (transaction: Transaction) => void;
  companies: Company[];
}

const RecentTransactions = ({ transactions, loading, onRowClick, companies }: RecentTransactionsProps) => {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
        <CardDescription>
          Suas últimas transações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Nenhuma transação recente.
          </div>
        ) : (
          <TransactionCardList transactions={transactions} onRowClick={onRowClick} companies={companies} loading={false} />
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;