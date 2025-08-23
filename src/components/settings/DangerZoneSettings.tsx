"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AlertTriangle, Trash2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResetConfirmationModal } from "./ResetConfirmationModal"; // Import the new confirmation modal

const resetSchema = z.object({
  transactions: z.boolean().default(false),
  categories: z.boolean().default(false),
  accounts: z.boolean().default(false),
  budgets: z.boolean().default(false),
  creditCards: z.boolean().default(false),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export function DangerZoneSettings() {
  const { session } = useSession();
  const { currentWorkspace, refreshWorkspaces, switchWorkspace, workspaces } = useWorkspace();
  const [isResetting, setIsResetting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false); // New state for the confirmation modal

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      transactions: false,
      categories: false,
      accounts: false,
      budgets: false,
      creditCards: false,
    },
  });

  // Reset confirmation text when dialog opens/closes
  useEffect(() => {
    if (!isAlertDialogOpen) {
      setConfirmationText("");
    }
  }, [isAlertDialogOpen]);

  const handleResetAccount = async (values: ResetFormValues) => {
    if (!session?.user || !currentWorkspace) {
      showError("Usuário não autenticado ou núcleo financeiro não selecionado.");
      return;
    }

    const selectedOptions = Object.keys(values).filter(key => values[key as keyof ResetFormValues]);

    if (selectedOptions.length === 0) {
      showError("Selecione pelo menos um tipo de dado para resetar.");
      return;
    }

    if (confirmationText !== "confirmar") {
      showError("Você deve digitar 'confirmar' para prosseguir.");
      return;
    }

    setIsResetting(true);

    try {
      // Deletion order to respect foreign key constraints
      // 1. Transactions (references categories, accounts, credit_card_bills)
      // 2. Budgets (references categories)
      // 3. Credit Cards (cascades to credit_card_bills)
      // 4. Categories
      // 5. Accounts

      if (values.transactions) {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', session.user.id)
          .eq('workspace_id', currentWorkspace.id);
        if (error) throw error;
      }

      if (values.budgets) {
        const { error } = await supabase
          .from('budgets')
          .delete()
          .eq('user_id', session.user.id)
          .eq('workspace_id', currentWorkspace.id);
        if (error) throw error;
      }

      if (values.creditCards) {
        const { error } = await supabase
          .from('credit_cards')
          .delete()
          .eq('user_id', session.user.id)
          .eq('workspace_id', currentWorkspace.id);
        if (error) throw error;
      }

      if (values.categories) {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('user_id', session.user.id)
          .eq('workspace_id', currentWorkspace.id);
        if (error) throw error;
      }

      if (values.accounts) {
        const { error } = await supabase
          .from('accounts')
          .delete()
          .eq('user_id', session.user.id)
          .eq('workspace_id', currentWorkspace.id);
        if (error) throw error;
      }

      // showSuccess("Dados selecionados resetados com sucesso!"); // Replaced by confirmation modal
      form.reset(); // Reset checkboxes
      setConfirmationText(""); // Clear confirmation text
      setIsAlertDialogOpen(false); // Close the alert dialog
      await refreshWorkspaces(); // Refresh workspace data
      setIsConfirmationModalOpen(true); // Open the new confirmation modal

    } catch (error: any) {
      console.error("Error resetting account data:", error);
      showError("Erro ao resetar dados: " + error.message);
    } finally {
      setIsResetting(false);
    }
  };

  const isAnyCheckboxChecked = form.watch("transactions") || form.watch("categories") || form.watch("accounts") || form.watch("budgets") || form.watch("creditCards");

  return (
    <>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Esta área contém ações irreversíveis. Prossiga com cautela.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Selecione os tipos de dados que deseja apagar do núcleo financeiro atual:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="transactions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Transações</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Todas as suas transações de despesa e renda.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Categorias</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Todas as suas categorias personalizadas.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accounts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Contas</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Todas as suas contas bancárias e saldos.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budgets"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Orçamentos</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Todos os seus orçamentos mensais.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="creditCards"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Cartões de Crédito</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Todos os seus cartões de crédito e faturas.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    className="mt-6 w-full sm:w-auto"
                    disabled={!isAnyCheckboxChecked || isResetting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Resetar Dados Selecionados
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Confirmação de Reset de Dados
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Você está prestes a apagar permanentemente os dados selecionados do seu núcleo financeiro atual.
                      Esta ação é irreversível. Para confirmar, digite "confirmar" no campo abaixo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label htmlFor="confirmation-input" className="sr-only">Digite 'confirmar'</Label>
                    <Input
                      id="confirmation-input"
                      placeholder="Digite 'confirmar'"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={form.handleSubmit(handleResetAccount)}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isResetting || confirmationText !== "confirmar"}
                    >
                      {isResetting ? "Resetando..." : "Confirmar Reset"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <FormMessage>{form.formState.errors.root?.message}</FormMessage>
            </form>
          </Form>
        </CardContent>
      </Card>
      <ResetConfirmationModal 
        isOpen={isConfirmationModalOpen} 
        onClose={() => setIsConfirmationModalOpen(false)} 
      />
    </>
  );
}