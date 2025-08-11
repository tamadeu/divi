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

interface AccountTransactionsTableProps {
  transactions: Transaction[];
}

const AccountTransactionsTable = ({ transactions }: AccountTransactionsTableProps) => {
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
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <div className="font-medium">{transaction.name}</div>
                <div className="text-sm text-muted-foreground">{transaction.date}</div>
              </TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={statusVariant[transaction.status]}>
                  {transaction.status}
                </Badge>
              </TableCell>
              <TableCell className={`text-right font-semibold ${transaction.amount > 0 ? 'text-green-500' : ''}`}>
                {transaction.amount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountTransactionsTable;