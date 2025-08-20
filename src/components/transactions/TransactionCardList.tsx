import { Skeleton } from "@/components/ui/skeleton";
import { Transaction, Company } from "@/types/database";
import TransactionCard from "./TransactionCard";
import { getCompanyLogo } from "@/utils/transaction-helpers";

interface TransactionCardListProps {
  transactions: Transaction[];
  loading: boolean;
  onEditTransaction?: (transaction: Transaction) => void; // Made optional
  companies: Company[];
}

const TransactionCardList = ({ transactions, loading, onEditTransaction, companies }: TransactionCardListProps) => {
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
        <TransactionCard
          key={transaction.id}
          transaction={transaction}
          onRowClick={onEditTransaction} // This will be undefined if not passed, but now handled safely
          companyLogo={getCompanyLogo(transaction.name, companies)}
        />
      ))}
    </div>
  );
};

export default TransactionCardList;