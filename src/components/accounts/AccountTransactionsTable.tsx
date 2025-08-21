import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Transaction, Company } from "@/types/database";
import { TransactionWithDetails } from "@/types/transaction-details"; // Import new type
import { useIsMobile } from "@/hooks/use-mobile";
import TransactionCardList from "@/components/transactions/TransactionCardList";
import { getCompanyLogo } from "@/utils/transaction-helpers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccountTransactionsTableProps {
  transactions: TransactionWithDetails[]; // Use new type
  onRowClick?: (transaction: Transaction) => void;
  companies: Company[];
}

const AccountTransactionsTable = ({ transactions, onRowClick, companies }: AccountTransactionsTableProps) => {
  const isMobile = useIsMobile();

  const statusVariant = {
    "Concluído": "default",
    "Pendente": "secondary",
    "Falhou": "destructive",
  } as const;

  const handleRowClick = (transaction: Transaction) => {
    if (onRowClick && typeof onRowClick === 'function') {
      onRowClick(transaction);
    }
  };

  // Renderizar cards no mobile
  if (isMobile) {
    return <TransactionCardList transactions={transactions} onRowClick={onRowClick} companies={companies} loading={false} />;
  }

  // Renderizar tabela no desktop
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Transação</TableHead>
            <TableHead className="hidden sm:table-cell">Categoria</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="text-right min-w-[100px]">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                onClick={() => handleRowClick(transaction)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'}`}
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
                    {transaction.category}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{transaction.category}</TableCell>
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
              <TableCell colSpan={4} className="h-24 text-center">
                Nenhuma transação encontrada para esta conta.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountTransactionsTable;