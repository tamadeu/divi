"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TransactionWithDetails } from "@/types/transaction-details";
import { showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TransactionDetailEditForm from "@/components/transactions/TransactionDetailEditForm";
import CreditCardTransactionDetailEditForm from "@/components/transactions/CreditCardTransactionDetailEditForm";
import NotFound from "./NotFound";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSession } from "@/contexts/SessionContext";

const TransactionDetailEditPage = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { session } = useSession();

  const [transaction, setTransaction] = useState<TransactionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionDetails = useCallback(async () => {
    if (!transactionId || !currentWorkspace || !session?.user) {
      setLoading(false);
      setError("Dados de sessão ou workspace ausentes.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('get_transaction_details', {
      p_transaction_id: transactionId,
      p_user_id: session.user.id,
      p_workspace_id: currentWorkspace.id,
    });

    if (rpcError) {
      console.error("Error fetching transaction details:", rpcError);
      setError("Erro ao carregar detalhes da transação: " + rpcError.message);
      setTransaction(null);
    } else if (data && data.length > 0) {
      setTransaction(data[0]);
    } else {
      setError("Transação não encontrada ou você não tem permissão para visualizá-la.");
      setTransaction(null);
    }
    setLoading(false);
  }, [transactionId, currentWorkspace, session?.user]);

  useEffect(() => {
    fetchTransactionDetails();
  }, [fetchTransactionDetails]);

  const handleTransactionUpdated = () => {
    showSuccess("Transação atualizada com sucesso!");
    navigate(-1); // Volta para a página anterior após a atualização
  };

  const handleTransactionDeleted = () => {
    showSuccess("Transação excluída com sucesso!");
    navigate(-1); // Volta para a página anterior após a exclusão
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  if (!transaction) {
    return <NotFound />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="icon">
          <Link to="/transactions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold md:text-2xl">Detalhes da Transação</h1>
      </div>

      {transaction.credit_card_bill_id ? (
        <CreditCardTransactionDetailEditForm
          transaction={transaction}
          onClose={() => navigate(-1)}
          onCreditCardTransactionUpdated={handleTransactionUpdated}
          onCreditCardTransactionDeleted={handleTransactionDeleted}
        />
      ) : (
        <TransactionDetailEditForm
          transaction={transaction}
          onClose={() => navigate(-1)}
          onTransactionUpdated={handleTransactionUpdated}
          onTransactionDeleted={handleTransactionDeleted}
        />
      )}
    </div>
  );
};

export default TransactionDetailEditPage;