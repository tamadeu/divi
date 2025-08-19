import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, PlusCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useModal } from "@/contexts/ModalContext";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from "@/utils/toast";

const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const { openAddAccountModal } = useModal();

  const fetchAccounts = async () => {
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

  const handleSetDefault = async (accountId: string) => {
    setSettingDefaultId(accountId);
    const { error } = await supabase.rpc('set_default_account', {
      account_id_to_set: accountId
    });

    if (error) {
      showError("Erro ao definir conta padrão: " + error.message);
    } else {
      showSuccess("Conta padrão atualizada com sucesso!");
      fetchAccounts();
    }
    setSettingDefaultId(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Contas</h1>
        <Button size="sm" className="gap-1" onClick={() => openAddAccountModal(fetchAccounts)}>
          <PlusCircle className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="flex flex-col">
              <Link to={`/accounts/${account.id}`} className="flex-grow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{account.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
              </Link>
              <div className="p-4 pt-0">
                {account.is_default ? (
                  <Badge>
                    <Star className="mr-2 h-4 w-4" />
                    Padrão
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(account.id)}
                    disabled={settingDefaultId === account.id}
                  >
                    {settingDefaultId === account.id ? "Definindo..." : "Tornar Padrão"}
                  </Button>
                )}
              </div>
            </Card>
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
            <Button className="mt-4" onClick={() => openAddAccountModal(fetchAccounts)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Conta
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountsPage;