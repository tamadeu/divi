import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/types/database";
import { Building, User } from "lucide-react";

interface TransactionCardProps {
  transaction: Transaction;
  onRowClick: (transaction: Transaction) => void;
  companyLogo?: string | null;
}

const TransactionCard = ({ transaction, onRowClick, companyLogo }: TransactionCardProps) => {
  // A badge de status foi removida conforme solicitado, então esta constante não é mais necessária aqui.
  // const statusVariant = {
  //   "Concluído": "default",
  //   "Pendente": "secondary",
  //   "Falhou": "destructive",
  // } as const;

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

  return (
    <div
      onClick={() => onRowClick(transaction)}
      className="flex items-center justify-between p-4 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1">
        {getAvatarContent()}
        
        <div className="flex-1 min-w-0"> {/* Adicionado min-w-0 para permitir truncamento */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate"> {/* Garantindo que o nome trunque */}
              {transaction.name}
            </h3>
            {/* A badge de status foi removida daqui */}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {getTransactionType()}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(transaction.date).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="text-right">
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