import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/data/mockData";

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
            <TableHead>Categoria</TableHead>
            <TableHead className="hidden sm:table-cell">Método</TableHead>
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
                    {transaction.date}
                  </div>
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {transaction.method}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={statusVariant[transaction.status]}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    transaction.amount > 0 ? "text-green-500" : ""
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