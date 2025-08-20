import { Skeleton } from "@/components/ui/skeleton";
import { Transaction, Company } from "@/types/database"; // Importar Company
import TransactionCard from "./TransactionCard"; // Importar o TransactionCard existente
import { getCompanyLogo } from "@/utils/transaction-helpers"; // Importar a função utilitária

interface TransactionCardListProps {
  transactions: Transaction[];
  loading: boolean;
  onRowClick: (transaction: Transaction) => void; // Adicionar prop onRowClick
  companies: Company[]; // Adicionar prop companies
}

const TransactionCardList = ({ transactions, loading, onRowClick, companies }: TransactionCardListProps) => {
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
          companyLogo={getCompanyLogo(transaction.name, companies)} // Usar a função para obter o logo
        />
      ))}
    </div>
  );
};

export default TransactionCardList;