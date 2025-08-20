import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, CreditCard as CreditCardIcon, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { CreditCard, CreditCardBill } from "@/types/credit-cards";
import AddCreditCardModal from "@/components/credit-cards/AddCreditCardModal";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CreditCardsPage = () => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { currentWorkspace } = useWorkspace();

  const fetchCreditCards = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Buscar cartões de crédito
    const { data: cardsData, error: cardsError } = await supabase
      .from("credit_cards")
      .select(`
        *,
        account:accounts (name, type)
      `)
      .eq("workspace_id", currentWorkspace.id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (cardsError) {
      console.error("Error fetching credit cards:", cardsError);
      showError("Erro ao carregar cartões de crédito.");
    } else {
      setCreditCards(cardsData || []);
    }

    // Buscar faturas recentes
    const { data: billsData, error: billsError } = await supabase
      .from("credit_card_bills")
      .select(`
        *,
        credit_card:credit_cards (name, brand, last_four_digits)
      `)
      .eq("workspace_id", currentWorkspace.id)
      .order("due_date", { ascending: true })
      .limit(10);

    if (billsError) {
      console.error("Error fetching bills:", billsError);
      showError("Erro ao carregar faturas.");
    } else {
      setBills(billsData || []);
    }

    setLoading(false);
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchCreditCards();
    }
  }, [currentWorkspace, fetchCreditCards]);

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBillStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paga';
      case 'overdue':
        return 'Vencida';
      case 'closed':
        return 'Fechada';
      case 'open':
        return 'Aberta';
      default:
        return status;
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Nenhum núcleo financeiro selecionado</h2>
          <p className="text-muted-foreground">Selecione um núcleo financeiro para ver seus cartões de crédito.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">Cartões de Crédito</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Cartão
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Cartões de Crédito */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Cartões</CardTitle>
            <CardDescription>
              Gerencie seus cartões de crédito e acompanhe os limites disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : creditCards.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CreditCardIcon className="mx-auto h-8 w-8 mb-2" />
                  <p>Nenhum cartão de crédito cadastrado.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {creditCards.map((card) => (
                  <Card key={card.id} className="relative overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{card.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {card.brand} •••• {card.last_four_digits}
                          </p>
                        </div>
                        <CreditCardIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Limite:</span>
                          <span className="font-medium">
                            {card.credit_limit.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Fechamento:</span>
                          <span>Dia {card.closing_day}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Vencimento:</span>
                          <span>Dia {card.due_day}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Conta:</span>
                          <span>{card.account?.name}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Faturas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Faturas Recentes</CardTitle>
            <CardDescription>
              Acompanhe suas faturas de cartão de crédito e seus vencimentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : bills.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="mx-auto h-8 w-8 mb-2" />
                  <p>Nenhuma fatura encontrada.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CreditCardIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {bill.credit_card?.name} •••• {bill.credit_card?.last_four_digits}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(bill.reference_month), "MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getBillStatusColor(bill.status)}>
                          {getBillStatusText(bill.status)}
                        </Badge>
                      </div>
                      <p className="font-semibold">
                        {bill.total_amount.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vence em {format(new Date(bill.due_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddCreditCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreditCardAdded={fetchCreditCards}
      />
    </>
  );
};

export default CreditCardsPage;