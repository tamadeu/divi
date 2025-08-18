import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AddAccountModal from "@/components/accounts/AddAccountModal";

const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAccounts = async () => {
    // Não precisa de setLoading(true) aqui para evitar piscar na atualização
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching accounts:", error);
      } else {
        setAccounts(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold md:text-2xl">Contas</h1>
              <Button size="sm" className="gap-1" onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Nova Conta
              </Button>
            </div>
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : accounts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                  <Link to={`/accounts/${account.id}`} key={account.id}>
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {account.name}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>{account.bank} - {account.type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {account.balance.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-1 text-center">
                  <h3 className="text-2xl font-bold tracking-tight">
                    Nenhuma conta encontrada
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Comece adicionando sua primeira conta.
                  </p>
                  <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Conta
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccountAdded={fetchAccounts}
      />
    </>
  );
};

export default AccountsPage;