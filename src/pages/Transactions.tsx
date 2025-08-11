import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import AllTransactionsTable from "@/components/transactions/AllTransactionsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TransactionsPage = () => {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Transactions</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>A complete list of your transactions. Click a row to see details.</CardDescription>
            </CardHeader>
            <CardContent>
              <AllTransactionsTable />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default TransactionsPage;