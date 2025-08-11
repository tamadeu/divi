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
            <h1 className="text-lg font-semibold md:text-2xl">Transações</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>Uma lista completa de suas transações. Clique em uma linha para ver os detalhes.</CardDescription>
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