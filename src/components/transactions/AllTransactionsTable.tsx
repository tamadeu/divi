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
import { useIsMobile } from "@/hooks/use-mobile";
import TransactionCardList from "./TransactionCardList";
import { getCompanyLogo } from "@/utils/transaction-helpers";

interface AllTransactionsTableProps {
  transactions: Transaction[];
  onRowClick?: (transaction: Transaction) => void;
  companies: Company[];
}

const AllTransactionsTable = ({ transactions, onRowClick, companies }: AllTransactionsTableProps) => {
  const isMobile = useIsMobile();
  
  console.log("AllTransactionsTable rendered:", {
    isMobile,
    transactionsCount: transactions.length,
    onRowClickExists: !!onRowClick,
    onRowClickType: typeof onRowClick
  });
  
  const statusVariant = {
    "Concluído": "default",
    "Pendente": "secondary",
    "Falhou": "destructive",
  } as const;

  const handleRowClick = (transaction: Transaction) => {
    console.log("AllTransactionsTable handleRowClick:", {
      transactionId: transaction.id,
      onRowClickExists: !!onRowClick,
      onRowClickType: typeof onRowClick
    });

    try {
      if (onRowClick && typeof onRowClick === 'function') {
        onRowClick(transaction);
      } else {
        console.warn("onRowClick is not a function or is undefined:", onRowClick);
      }
    } catch (error) {
      console.error("Error calling onRowClick:", error);
    }
  };

  // Renderizar cards no mobile
  if (isMobile) {
    console.log("Rendering mobile view with TransactionCardList");
    return <TransactionCardList transactions={transactions} onRowClick={onRowClick} companies={companies} loading={false} />;
  }

  // Renderizar tabela no desktop
  console.log("Rendering desktop view with Table");
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Transação</TableHead>
            <TableHead className="hidden lg:table-cell">Conta</TableHead>
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
                  </div>
                  <div className="text-xs text-muted-foreground sm:hidden">
                    {transaction.category}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {transaction.account ? (
                    <>
                      <div className="font-medium">{transaction.account.name}</div>
                      <div className="text-sm text-muted-foreground">{transaction.account.type}</div>
                    </>
                  ) : (
                    "N/A"
                  )}
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
              <TableCell colSpan={5} className="h-24 text-center">
                Nenhuma transação encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AllTransactionsTable;