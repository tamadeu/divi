import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Transaction, Company } from "@/types/database"; // Importar Company
import { useIsMobile } from "@/hooks/use-mobile";
import TransactionCardList from "@/components/transactions/TransactionCardList";

interface AccountTransactionsTableProps {
  transactions: Transaction[];
  onRowClick: (transaction: Transaction) => void;
  companies: Company[]; // Adicionar prop companies
}

const AccountTransactionsTable = ({ transactions, onRowClick, companies }: AccountTransactionsTableProps) => {
  const isMobile = useIsMobile();

  const statusVariant = {
    "Concluído": "default",
    "Pendente": "secondary",
    "Falhou": "destructive",
  } as const;

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
                onClick={() => onRowClick(transaction)}
                className="cursor-pointer hover:bg-muted/50"
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
                Nenhuma transação encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountTransactionsTable;