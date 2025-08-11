import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionDetailsModal = ({ transaction, isOpen, onClose }: TransactionDetailsModalProps) => {
  if (!transaction) return null;

  const statusVariant = {
    Completed: "default",
    Pending: "secondary",
    Failed: "destructive",
  } as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>Detailed view of your transaction.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Name</span>
            <span className="col-span-3 font-semibold">{transaction.name}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Amount</span>
            <span className={`col-span-3 font-semibold ${transaction.amount > 0 ? 'text-green-500' : ''}`}>
              {transaction.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Date</span>
            <span className="col-span-3">{transaction.date}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Status</span>
            <div className="col-span-3">
              <Badge variant={statusVariant[transaction.status]}>{transaction.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Category</span>
            <span className="col-span-3">{transaction.category}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Method</span>
            <span className="col-span-3">{transaction.method}</span>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground pt-1">Description</span>
            <p className="col-span-3 text-sm">{transaction.description}</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsModal;