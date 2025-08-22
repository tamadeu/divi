"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TransactionWithDetails } from "@/types/transaction-details";
import { showError } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSession } from "@/contexts/SessionContext";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import EditCreditCardTransactionModal from "@/components/transactions/EditCreditCardTransactionModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TransactionDetailsPage = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { session } = useSession();

  const [transaction, setTransaction] = useState<TransactionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionDetails = useCallback(async () => {
    if (!transactionId || !currentWorkspace || !session?.user) {
      setError("Dados insuficientes para carregar a transação.");
      setLoading(false);
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
      showError("Erro ao carregar detalhes da transação.");
      setTransaction(null);
    } else if (data && data.length > 0) {
      setTransaction(data[0]);
    } else {
      setError("Transação não encontrada.");
      setTransaction(null);
    }
    setLoading(false);
  }, [transactionId, currentWorkspace, session?.user]);

  useEffect(() => {
    fetchTransactionDetails();
  }, [fetchTransactionDetails]);

  const handleModalClose = () => {
    // Navigate back to the previous page (e.g., /transactions or /search-results)
    navigate(-1); 
  };

  const handleTransactionUpdated = () => {
    // Re-fetch transaction details to ensure the page has the latest data
    fetchTransactionDetails();
    // Optionally, navigate back after update, or let the user stay on the page
    // For now, let's just re-fetch and keep the modal open with updated data
    // If the user closes the modal, handleModalClose will navigate back.
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <h2 className="text-xl font-semibold text-destructive mb-4">Erro</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <h2 className="text-xl font-semibold text-muted-foreground mb-4">Transação não encontrada</h2>
        <p className="text-muted-foreground mb-6">A transação que você está procurando não existe ou você não tem permissão para vê-la.</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  // Determine which modal to render based on transaction type (e.g., if it has a credit_card_bill_id)
  const isCreditCardTransaction = !!transaction.credit_card_bill_id;

  return (
    <div className="p-4">
      {isCreditCardTransaction ? (
        <EditCreditCardTransactionModal
          isOpen={true} // Always open on this dedicated page
          onClose={handleModalClose}
          onCreditCardTransactionUpdated={handleTransactionUpdated}
          transaction={transaction}
        />
      ) : (
        <EditTransactionModal
          isOpen={true} // Always open on this dedicated page
          onClose={handleModalClose}
          onTransactionUpdated={handleTransactionUpdated}
          transaction={transaction}
        />
      )}
    </div>
  );
};

export default TransactionDetailsPage;