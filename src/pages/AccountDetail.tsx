import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { accountsData, allTransactions, Transaction } from "@/data/mockData";
import NotFound from "./NotFound";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AccountTransactionsTable from "@/components/accounts/AccountTransactionsTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TransactionDetailsModal from "@/components/transactions/TransactionDetailsModal";

const AccountDetailPage = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const account = accountsData.find((acc) => acc.id === accountId);
  const accountTransactions = allTransactions.filter(
    (trans) => trans.accountId === accountId
  );

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

  if (!account) {
    return <NotFound />;
  }

  return (
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="icon">
                <Link to="/accounts">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-lg font-semibold md:text-2xl">{account.name}</h1>
            </div>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Conta</CardTitle>
                  <CardDescription>{account.bank} - {account.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    Saldo:{" "}
                    {account.balance.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Transações da Conta</CardTitle>
                  <CardDescription>
                    Uma lista de transações para esta conta. Clique em uma linha para ver os detalhes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AccountTransactionsTable
                    transactions={accountTransactions}
                    onRowClick={handleRowClick}
                  />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
};

export default AccountDetailPage;