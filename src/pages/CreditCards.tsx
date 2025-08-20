"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, CreditCard as CreditCardIcon, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { CreditCardWithAccount } from "@/types/database";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Skeleton } from "@/components/ui/skeleton";
import AddEditCreditCardModal from "@/components/credit-cards/AddEditCreditCardModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CreditCardsPage = () => {
  const [creditCards, setCreditCards] = useState<CreditCardWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCreditCard, setSelectedCreditCard] = useState<CreditCardWithAccount | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentWorkspace } = useWorkspace();

  const fetchCreditCards = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("credit_cards")
      .select(`
        *,
        account:accounts (name, type, balance)
      `)
      .eq("workspace_id", currentWorkspace.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching credit cards:", error);
      showError("Erro ao carregar cartões de crédito.");
    } else {
      setCreditCards(data || []);
    }
    setLoading(false);
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchCreditCards();
    }
  }, [currentWorkspace, fetchCreditCards]);

  const handleAddCreditCard = () => {
    setSelectedCreditCard(null);
    setIsModalOpen(true);
  };

  const handleEditCreditCard = (card: CreditCardWithAccount) => {
    setSelectedCreditCard(card);
    setIsModalOpen(true);
  };

  const handleDeleteCreditCard = async () => {
    if (!selectedCreditCard) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("credit_cards")
        .delete()
        .eq("id", selectedCreditCard.id);

      if (error) {
        showError("Erro ao excluir cartão de crédito: " + error.message);
      } else {
        showSuccess("Cartão de crédito excluído com sucesso!");
        fetchCreditCards();
        setShowDeleteDialog(false);
        setSelectedCreditCard(null);
      }
    } catch (error) {
      showError("Erro inesperado ao excluir cartão de crédito.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Nenhum núcleo financeiro selecionado</h2>
          <p className="text-muted-foreground">Selecione um núcleo financeiro para gerenciar seus cartões de crédito.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-lg font-semibold md:text-2xl">Cartões de Crédito</h1>
        <Button onClick={handleAddCreditCard} className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Adicionar Cartão
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seus Cartões de Crédito</CardTitle>
          <CardDescription>
            Gerencie seus cartões de crédito e suas configurações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : creditCards.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Nenhum cartão de crédito cadastrado.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {creditCards.map((card) => (
                <Card key={card.id} className="relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">{card.name}</CardTitle>
                    <CreditCardIcon className="h-6 w-6 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">
                      {card.credit_limit.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Limite de Crédito
                    </p>
                    <div className="mt-4 text-sm">
                      <p><strong>Bandeira:</strong> {card.brand}</p>
                      <p><strong>Últimos 4 Dígitos:</strong> {card.last_four_digits}</p>
                      <p><strong>Conta Vinculada:</strong> {card.account?.name || "N/A"}</p>
                      <p><strong>Fechamento:</strong> Dia {card.closing_day}</p>
                      <p><strong>Vencimento:</strong> Dia {card.due_day}</p>
                    </div>
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditCreditCard(card)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          setSelectedCreditCard(card);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddEditCreditCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreditCardSaved={fetchCreditCards}
        creditCard={selectedCreditCard}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cartão de crédito "{selectedCreditCard?.name}"?
              Esta ação não pode ser desfeita e removerá todas as faturas e transações associadas a este cartão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCreditCard}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreditCardsPage;