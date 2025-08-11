import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { allTransactions, Transaction } from "@/data/mockData";
import TransactionDetailsModal from "./TransactionDetailsModal";

const AllTransactionsTable = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTransaction(null), 300);
  };

  const statusVariant = {
    Completed: "default",
    Pending: "secondary",
    Failed: "destructive",
  } as const;

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTransactions.map((transaction) => (
              <TableRow key={transaction.id} onClick={() => handleRowClick(transaction)} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="font-medium">{transaction.name}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {transaction.method}
                  </div>
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={statusVariant[transaction.status]}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{transaction.date}</TableCell>
                <TableCell className={`text-right font-semibold ${transaction.amount > 0 ? 'text-green-500' : ''}`}>
                  {transaction.amount.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
};

export default AllTransactionsTable;