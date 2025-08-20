import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, CreditCard as CreditCardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import AddCreditCardModal from "@/components/credit-cards/AddCreditCardModal";
import EditCreditCardModal from "@/components/credit-cards/EditCreditCardModal";

interface CreditCard {
  id: string;
  name: string;
  brand: string;
  last_four_digits: string;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  is_active: boolean;
  account: {
    name: string;
    bank: string;
  };
}

const CreditCards = () => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (currentWorkspace) {
      fetchCreditCards();
    }
  }, [currentWorkspace]);

  const fetchCreditCards = async () => {
    if (!currentWorkspace) return;

    const { data, error } = await supabase
      .from("credit_cards")
      .select(`
        *,
        account:accounts(name, bank)
      `)
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false });

    if (error) {
      showError("Erro ao carregar cartões de crédito");
      console.error("Error fetching credit cards:", error);
    } else {
      setCreditCards(data || []);
    }
    setLoading(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    const { error } = await supabase
      .from("credit_cards")
      .delete()
      .eq("id", cardId);

    if (error) {
      showError("Erro ao excluir cartão de crédito");
    } else {
      showSuccess("Cartão de crédito excluído com sucesso!");
      fetchCreditCards();
    }
  };

  const handleEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setIsEditModalOpen(true);
  };

  const handleCardUpdated = () => {
    fetchCreditCards();
    setIsEditModalOpen(false);
    setEditingCard(null);
  };

  const handleCardAdded = () => {
    fetchCreditCards();
    setIsAddModalOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const getBrandColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "mastercard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "american express":
      case "amex":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "elo":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cartões de Crédito</h1>
            <p className="text-muted-foreground">
              Gerencie seus cartões de crédito e faturas.
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cartão
          </Button>
        </div>
        <div className="text-center py-8">Carregando cartões de crédito...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cartões de Crédito</h1>
          <p className="text-muted-foreground">
            Gerencie seus cartões de crédito e faturas.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {creditCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <CreditCardIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Nenhum cartão de crédito encontrado</h3>
              <p className="text-muted-foreground">
                Comece adicionando seu primeiro cartão de crédito.
              </p>
              <Button onClick={() => setIsAddModalOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Cartão
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {creditCards.map((card) => (
            <Card key={card.id} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full" />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCardIcon className="h-5 w-5" />
                      {card.name}
                    </CardTitle>
                    <CardDescription>
                      {card.account.name} - {card.account.bank}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getBrandColor(card.brand)}>
                      {card.brand}
                    </Badge>
                    {!card.is_active && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Final:</span>
                    <span className="font-mono">**** {card.last_four_digits}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Limite:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(card.credit_limit)}
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
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCard(card)}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cartão de crédito</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o cartão "{card.name}"? 
                          Esta ação não pode ser desfeita e todas as faturas associadas serão perdidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCard(card.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir Cartão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Credit Card Modal */}
      <AddCreditCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCardAdded={handleCardAdded}
      />

      {/* Edit Credit Card Modal */}
      {editingCard && (
        <EditCreditCardModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCard(null);
          }}
          card={editingCard}
          onCardUpdated={handleCardUpdated}
        />
      )}
    </div>
  );
};

export default CreditCards;