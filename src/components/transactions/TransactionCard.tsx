import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Transaction } from "@/types/database";
import { TransactionWithDetails } from "@/types/transaction-details"; // Import new type
import { Building, User, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface TransactionCardProps {
  transaction: TransactionWithDetails; // Use new type
  // onRowClick?: (transaction: TransactionWithDetails) => void; // No longer needed, will navigate
  companyLogo?: string | null;
}

const TransactionCard = ({ transaction, companyLogo }: TransactionCardProps) => {
  const navigate = useNavigate(); // Initialize useNavigate

  const getTransactionType = () => {
    if (transaction.transfer_id) {
      return "Transferência";
    }
    if (transaction.credit_card_bill_id) { // Check for credit_card_bill_id
      const cardName = transaction.cc_name || "Cartão de Crédito"; // Use cc_name
      const installmentInfo = transaction.total_installments && transaction.installment_number
        ? ` (${transaction.installment_number}/${transaction.total_installments})`
        : '';
      return `${cardName}${installmentInfo}`;
    }
    return transaction.category_name || "Sem categoria"; // Use category_name
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

    if (transaction.credit_card_bill_id) { // Check for credit_card_bill_id
      return (
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-purple-100 text-purple-600">
            <CreditCard className="h-6 w-6" />
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
    console.log("TransactionCard clicked - navigating to:", `/transactions/${transaction.id}`);
    navigate(`/transactions/${transaction.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between p-4 bg-card rounded-lg border border-border shadow-sm transition-shadow cursor-pointer hover:shadow-md active:bg-muted/50`}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        userSelect: 'none'
      }}
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
        {transaction.credit_card_bill_id && transaction.cc_bill_reference_month && ( // Check for credit_card_bill_id and reference month
          <p className="text-xs text-muted-foreground mt-1">
            Fatura: {format(new Date(transaction.cc_bill_reference_month), 'MMM/yy', { locale: ptBR })}
          </p>
        )}
      </div>
    </div>
  );
};

export default TransactionCard;