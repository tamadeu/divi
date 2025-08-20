import { Skeleton } from "@/components/ui/skeleton";
import { Transaction } from "@/types/database";
import TransactionCard from "./TransactionCard"; // Importar o TransactionCard existente

interface TransactionCardListProps {
  transactions: Transaction[];
  loading: boolean;
  onRowClick: (transaction: Transaction) => void; // Adicionar prop onRowClick
}

const TransactionCardList = ({ transactions, loading, onRowClick }: TransactionCardListProps) => {
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
          onRowClick={onRowClick} // Passar a função onRowClick
          companyLogo={null} // Não temos logo de empresa para transações recentes aqui
        />
      ))}
    </div>
  );
};

export default TransactionCardList;