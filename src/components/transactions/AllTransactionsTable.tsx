import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Company } from "@/types/database";
import { TransactionWithDetails } from "@/types/transaction-details";
import { useIsMobile } from "@/hooks/use-mobile";
import TransactionCardList from "./TransactionCardList";
import { getCompanyLogo } from "@/utils/transaction-helpers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface AllTransactionsTableProps {
  transactions: TransactionWithDetails[];
  companies: Company[];
}

const AllTransactionsTable = ({ transactions, companies }: AllTransactionsTableProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const statusVariant = {
    "Concluído": "default",
    "Pendente": "secondary",
    "Falhou": "destructive",
  } as const;

  const handleRowClick = (transaction: TransactionWithDetails) => {
    navigate(`/transactions/${transaction.id}`);
  };

  const getCategoryDisplayName = (transaction: TransactionWithDetails) => {
    if (transaction.parent_category_name && transaction.category_name) {
      return `${transaction.parent_category_name} > ${transaction.category_name}`;
    }
    return transaction.category_name;
  };

  // Renderizar cards no mobile
  if (isMobile) {
    return <TransactionCardList transactions={transactions} companies={companies} loading={false} />;
  }

  // Renderizar tabela no desktop
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader><TableRow>
            <TableHead className="min-w-[150px]">Transação</TableHead>
            <TableHead className="hidden lg:table-cell">Conta/Cartão</TableHead>
            <TableHead className="hidden sm:table-cell">Categoria</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="text-right min-w-[100px]">Valor</TableHead>
          </TableRow></TableHeader>
        <TableBody>{transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                onClick={() => handleRowClick(transaction)}
                className={`cursor-pointer hover:bg-muted/50`}
              >
                <TableCell className="min-w-[150px]">
                  <div className="font-medium">{transaction.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString("pt-BR")}
                    {transaction.installment_number && transaction.total_installments && (
                      <span className="ml-1">({transaction.installment_number}/{transaction.total_installments})</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground sm:hidden">
                    {getCategoryDisplayName(transaction)}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {transaction.account_id ? (
                    <>
                      <div className="font-medium">{transaction.account_name}</div>
                      <div className="text-sm text-muted-foreground">{transaction.account_type}</div>
                    </>
                  ) : transaction.credit_card_bill_id ? (
                    <>
                      <div className="font-medium">{transaction.cc_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.cc_brand} (**** {transaction.cc_last_four_digits})
                      </div>
                      {transaction.cc_bill_reference_month && (
                        <div className="text-xs text-muted-foreground">
                          Fatura: {format(new Date(transaction.cc_bill_reference_month), 'MMM/yy', { locale: ptBR })}
                        </div>
                      )}
                    </>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">{getCategoryDisplayName(transaction)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={statusVariant[transaction.status]}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-semibold min-w-[100px] ${
                    transaction.amount > 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  <div>
                    {transaction.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                  <div className="text-xs md:hidden">
                    <Badge variant={statusVariant[transaction.status]} className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Nenhuma transação encontrada.
              </TableCell>
            </TableRow>
          )}</TableBody>
      </Table>
    </div>
  );
};

export default AllTransactionsTable;