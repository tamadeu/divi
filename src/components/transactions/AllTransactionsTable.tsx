import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/types/database";

interface AllTransactionsTableProps {
  transactions: Transaction[];
  onRowClick: (transaction: Transaction) => void;
}

const AllTransactionsTable = ({ transactions, onRowClick }: AllTransactionsTableProps) => {
  const statusVariant = {
    "Concluído": "default",
    "Pendente": "secondary",
    "Falhou": "destructive",
  } as const;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transação</TableHead>
            <TableHead className="hidden md:table-cell">Conta</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                onClick={() => onRowClick(transaction)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>
                  <div className="font-medium">{transaction.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString("pt-BR")}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {transaction.account ? (
                    <>
                      <div className="font-medium">{transaction.account.name}</div>
                      <div className="text-sm text-muted-foreground">{transaction.account.type}</div>
                    </>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={statusVariant[transaction.status]}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    transaction.amount > 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {transaction.amount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
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