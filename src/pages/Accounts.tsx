import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Account } from "@/types/database";
import AccountsTable from "@/components/accounts/AccountsTable";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useModal } from "@/contexts/ModalContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { openAddAccountModal } = useModal();
  const { currentWorkspace } = useWorkspace();

  const fetchAccounts = async () => {
    if (!currentWorkspace) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching accounts:", error);
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentWorkspace) {
      fetchAccounts();
    }
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Nenhum núcleo financeiro selecionado</h2>
          <p className="text-muted-foreground">Selecione um núcleo financeiro para ver suas contas.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Contas</h1>
        <Button onClick={() => openAddAccountModal(fetchAccounts)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Suas Contas</CardTitle>
          <CardDescription>
            Gerencie suas contas bancárias e cartões de crédito.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <AccountsTable accounts={accounts} onAccountUpdated={fetchAccounts} />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AccountsPage;