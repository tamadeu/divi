"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showError, showSuccess } from "@/utils/toast";
import { Account, Transaction } from "@/types/database";
import { Loader2 } from "lucide-react";

interface ConfirmDeleteAccountWithTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onAccountDeleted: () => void; // Callback to refresh accounts list
}

const ConfirmDeleteAccountWithTransactionsModal = ({
  isOpen,
  onClose,
  account,
  onAccountDeleted,
}: ConfirmDeleteAccountWithTransactionsModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [otherAccounts, setOtherAccounts] = useState<Account[]>([]);
  const [selectedReassignAccountId, setSelectedReassignAccountId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkTransactionsAndFetchAccounts = async () => {
      if (!isOpen || !account) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasTransactions(false);
      setSelectedReassignAccountId(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError("Você precisa estar logado.");
        setIsLoading(false);
        return;
      }

      // Check for transactions
      const { count: transactionsCount, error: countError } = await supabase
        .from("transactions")
        .select("id", { count: "exact" })
        .eq("account_id", account.id)
        .eq("user_id", user.id);

      if (countError) {
        console.error("Error checking transactions:", countError);
        showError("Erro ao verificar transações.");
        setIsLoading(false);
        return;
      }

      setHasTransactions((transactionsCount || 0) > 0);

      // Fetch other accounts for reassign option
      if ((transactionsCount || 0) > 0) {
        const { data: accountsData, error: accountsError } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .neq("id", account.id) // Exclude the account being deleted
          .order("name", { ascending: true });

        if (accountsError) {
          console.error("Error fetching other accounts:", accountsError);
          showError("Erro ao carregar outras contas.");
        } else {
          setOtherAccounts(accountsData || []);
          if (accountsData && accountsData.length > 0) {
            setSelectedReassignAccountId(accountsData[0].id); // Pre-select the first available account
          }
        }
      }
      setIsLoading(false);
    };

    checkTransactionsAndFetchAccounts();
  }, [isOpen, account]);

  // Helper function to process transfer transactions and update balances
  const processTransferTransactions = async (transactions: Transaction[]) => {
    const transferIdsProcessed = new Set<string>();
    const allTransferTransactionIdsToDelete = new Set<string>();

    for (const t of transactions) {
      if (t.transfer_id && !transferIdsProcessed.has(t.transfer_id)) {
        transferIdsProcessed.add(t.transfer_id); // Mark this transfer_id as processed

        // Fetch both sides of the transfer
        const { data: transferTransactions, error: fetchTransferError } = await supabase
          .from("transactions")
          .select("id, amount, account_id")
          .eq("transfer_id", t.transfer_id);

        if (fetchTransferError || !transferTransactions || transferTransactions.length !== 2) {
          console.warn("Could not find complete transfer pair for transaction:", t.id, fetchTransferError);
          continue; // Skip if pair is incomplete or error
        }

        const [trans1, trans2] = transferTransactions;

        // Identify which transaction belongs to the account being deleted
        const otherTransaction = trans1.account_id === account?.id ? trans2 : trans1;

        if (otherTransaction) {
          // Fetch the current balance of the other account
          const { data: accountToUpdate, error: fetchAccountError } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", otherTransaction.account_id)
            .single();

          if (fetchAccountError || !accountToUpdate) {
            console.error("Error fetching account for balance update:", otherTransaction.account_id, fetchAccountError);
            throw new Error("Could not fetch account for balance update.");
          }

          // Revert the amount: if it was an income to the other account, subtract it; if it was an expense, add it back.
          const newBalance = accountToUpdate.balance - otherTransaction.amount; 

          const { error: updateBalanceError } = await supabase
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", otherTransaction.account_id);

          if (updateBalanceError) {
            console.error("Error updating balance for account:", otherTransaction.account_id, updateBalanceError);
            throw updateBalanceError;
          }
        }
        
        // Add both transaction IDs to the list for deletion
        allTransferTransactionIdsToDelete.add(trans1.id);
        allTransferTransactionIdsToDelete.add(trans2.id);
      }
    }
    return Array.from(allTransferTransactionIdsToDelete);
  };

  const handleDeleteAllTransactions = async () => {
    if (!account) return;
    setIsSubmitting(true);

    try {
      const { data: transactionsInAccount, error: fetchError } = await supabase
        .from("transactions")
        .select("id, amount, account_id, transfer_id")
        .eq("account_id", account.id);

      if (fetchError) throw fetchError;

      const transferTransactionIdsToDelete = await processTransferTransactions(transactionsInAccount);

      // Collect all transaction IDs to delete (transfers + regular)
      const allTransactionIdsToDelete = new Set(transferTransactionIdsToDelete);
      transactionsInAccount.forEach(t => {
        if (!t.transfer_id) { // Add regular transactions
          allTransactionIdsToDelete.add(t.id);
        }
      });

      if (allTransactionIdsToDelete.size > 0) {
        const { error: deleteTransactionsError } = await supabase
          .from("transactions")
          .delete()
          .in("id", Array.from(allTransactionIdsToDelete));
        if (deleteTransactionsError) throw deleteTransactionsError;
      }

      // Finally, delete the account
      const { error: deleteAccountError } = await supabase
        .from("accounts")
        .delete()
        .eq("id", account.id);
      if (deleteAccountError) throw deleteAccountError;

      showSuccess("Conta e todas as transações relacionadas excluídas com sucesso!");
      onAccountDeleted();
      onClose();
    } catch (error: any) {
      showError("Erro ao excluir conta e transações: " + error.message);
      console.error("Delete error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassignTransactions = async () => {
    if (!account || !selectedReassignAccountId) return;
    setIsSubmitting(true);

    try {
      const { data: transactionsInAccount, error: fetchError } = await supabase
        .from("transactions")
        .select("id, amount, account_id, transfer_id")
        .eq("account_id", account.id);

      if (fetchError) throw fetchError;

      const transferTransactionIdsToDelete = await processTransferTransactions(transactionsInAccount);

      const regularTransactionIdsToReassign = transactionsInAccount
        .filter(t => !t.transfer_id)
        .map(t => t.id);

      // Delete all identified transfer transactions
      if (transferTransactionIdsToDelete.length > 0) {
        const { error: deleteTransfersError } = await supabase
          .from("transactions")
          .delete()
          .in("id", transferTransactionIdsToDelete);
        if (deleteTransfersError) throw deleteTransfersError;
      }

      // Reassign non-transfer transactions
      if (regularTransactionIdsToReassign.length > 0) {
        const { error: reassignError } = await supabase
          .from("transactions")
          .update({ account_id: selectedReassignAccountId })
          .in("id", regularTransactionIdsToReassign);
        if (reassignError) throw reassignError;
      }

      // Finally, delete the original account
      const { error: deleteAccountError } = await supabase
        .from("accounts")
        .delete()
        .eq("id", account.id);
      if (deleteAccountError) throw deleteAccountError;

      showSuccess("Transações reatribuídas e conta excluída com sucesso!");
      onAccountDeleted();
      onClose();
    } catch (error: any) {
      showError("Erro ao reatribuir transações e excluir conta: " + error.message);
      console.error("Reassign error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Excluir Conta: {account.name}</DialogTitle>
          <DialogDescription>
            Esta conta possui transações associadas. Por favor, escolha como deseja proceder.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Verificando transações...</span>
          </div>
        ) : hasTransactions ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Você pode excluir todas as transações relacionadas a esta conta ou reatribuí-las a outra conta existente.
              <br/>
              <span className="font-semibold text-red-500">Atenção: Transações de transferência (origem e destino) serão sempre excluídas e seus saldos revertidos nas contas de origem/destino.</span>
            </p>

            <div className="flex flex-col gap-4">
              <Button
                variant="destructive"
                onClick={handleDeleteAllTransactions}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Excluir Conta e Todas as Transações
              </Button>

              <div className="flex items-center gap-2">
                <Select
                  value={selectedReassignAccountId || ""}
                  onValueChange={setSelectedReassignAccountId}
                  disabled={otherAccounts.length === 0 || isSubmitting}
                >
                  <SelectTrigger className="flex-grow">
                    <SelectValue placeholder="Selecione uma conta para reatribuir" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherAccounts.length === 0 ? (
                      <SelectItem value="no-other-accounts" disabled>
                        Nenhuma outra conta disponível
                      </SelectItem>
                    ) : (
                      otherAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.bank})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleReassignTransactions}
                  disabled={!selectedReassignAccountId || isSubmitting || otherAccounts.length === 0}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Reatribuir e Excluir Conta
                </Button>
              </div>
              {otherAccounts.length === 0 && hasTransactions && (
                <p className="text-sm text-red-500">
                  Não há outras contas para reatribuir as transações. Você deve excluir todas as transações.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-lg font-semibold mb-2">Esta conta não possui transações.</p>
            <p className="text-sm text-muted-foreground">
              Você pode prosseguir com a exclusão direta da conta.
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteAllTransactions} // This will just delete the account
              disabled={isSubmitting}
              className="mt-4"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar Exclusão da Conta
            </Button>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteAccountWithTransactionsModal;