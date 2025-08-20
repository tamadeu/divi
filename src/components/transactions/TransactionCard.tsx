import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Transaction } from "@/types/database";
import { Building, User } from "lucide-react";

interface TransactionCardProps {
  transaction: Transaction;
  onRowClick?: (transaction: Transaction) => void; // Made optional with default
  companyLogo?: string | null;
}

const TransactionCard = ({ transaction, onRowClick, companyLogo }: TransactionCardProps) => {
  const getTransactionType = () => {
    if (transaction.transfer_id) {
      return "Transferência";
    }
    return transaction.category || "Sem categoria";
  };

  const getAvatarContent = () => {
    if (transaction.transfer_id) {
      return (
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-blue-100 text-blue-600">
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      );
    }

    if (companyLogo) {
      return (
        <Avatar className="h-12 w-12">
          <AvatarImage src={companyLogo} alt={transaction.name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Building className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      );
    }

    return (
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-gray-100 text-gray-600">
          <Building className="h-6 w-6" />
        </AvatarFallback>
      </Avatar>
    );
  };

  const handleClick = () => {
    if (onRowClick && typeof onRowClick === 'function') {
      onRowClick(transaction);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between p-4 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow ${
        onRowClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getAvatarContent()}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground mb-1">
            {transaction.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {getTransactionType()}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(transaction.date).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p
          className={`font-semibold ${
            transaction.amount > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {transaction.amount > 0 ? "+" : ""}
          {transaction.amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
      </div>
    </div>
  );
};

export default TransactionCard;