import { Skeleton } from "@/components/ui/skeleton";
import { Company } from "@/types/database";
import { TransactionWithDetails } from "@/types/transaction-details"; // Import new type
import TransactionCard from "./TransactionCard";
import { getCompanyLogo } from "@/utils/transaction-helpers";

interface TransactionCardListProps {
  transactions: TransactionWithDetails[]; // Use new type
  loading: boolean;
  onRowClick?: (transaction: TransactionWithDetails) => void; // Update type for onRowClick
  companies: Company[];
}

const TransactionCardList = ({ transactions, loading, onRowClick, companies }: TransactionCardListProps) => {
  console.log("TransactionCardList rendered:", {
    transactionsCount: transactions.length,
    onRowClickExists: !!onRowClick,
    onRowClickType: typeof onRowClick,
    loading
  });

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
      {transactions.map((transaction, index) => {
        console.log(`Rendering TransactionCard ${index}:`, {
          transactionId: transaction.id,
          transactionName: transaction.name,
          onRowClickPassed: !!onRowClick
        });
        
        return (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onRowClick={onRowClick}
            companyLogo={getCompanyLogo(transaction.name, companies)}
          />
        );
      })}
    </div>
  );
};

export default TransactionCardList;