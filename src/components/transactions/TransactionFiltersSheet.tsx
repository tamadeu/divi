"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface TransactionFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  accountTypeFilter: string;
  setAccountTypeFilter: (value: string) => void;
  uniqueCategories: string[];
  onApplyFilters: () => void;
}

const TransactionFiltersSheet = ({
  isOpen,
  onClose,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  accountTypeFilter,
  setAccountTypeFilter,
  uniqueCategories,
  onApplyFilters,
}: TransactionFiltersSheetProps) => {
  // Internal state for filters to allow "Apply" button
  const [tempStatusFilter, setTempStatusFilter] = useState(statusFilter);
  const [tempCategoryFilter, setTempCategoryFilter] = useState(categoryFilter);
  const [tempAccountTypeFilter, setTempAccountTypeFilter] = useState(accountTypeFilter);

  useEffect(() => {
    if (isOpen) {
      setTempStatusFilter(statusFilter);
      setTempCategoryFilter(categoryFilter);
      setTempAccountTypeFilter(accountTypeFilter);
    }
  }, [isOpen, statusFilter, categoryFilter, accountTypeFilter]);

  const handleApply = () => {
    setStatusFilter(tempStatusFilter);
    setCategoryFilter(tempCategoryFilter);
    setAccountTypeFilter(tempAccountTypeFilter);
    onApplyFilters();
    onClose();
  };

  const handleReset = () => {
    setTempStatusFilter("all");
    setTempCategoryFilter("all");
    setTempAccountTypeFilter("all");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Filtros de Transações</SheetTitle>
          <SheetDescription>
            Aplique filtros para refinar sua lista de transações.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4 flex-1 overflow-y-auto">
          <div className="grid gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium">Status</label>
            <Select
              value={tempStatusFilter}
              onValueChange={setTempStatusFilter}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Falhou">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="category-filter" className="text-sm font-medium">Categoria</label>
            <Select
              value={tempCategoryFilter}
              onValueChange={setTempCategoryFilter}
            >
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="account-type-filter" className="text-sm font-medium">Tipo de Conta</label>
            <Select
              value={tempAccountTypeFilter}
              onValueChange={setTempAccountTypeFilter}
            >
              <SelectTrigger id="account-type-filter">
                <SelectValue placeholder="Filtrar por tipo de conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos de Conta</SelectItem>
                <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                <SelectItem value="Poupança">Poupança</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                <SelectItem value="Investimento">Investimento</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter className="flex flex-col sm:flex-col gap-2">
          <Button type="button" onClick={handleApply} className="w-full">
            Aplicar Filtros
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} className="w-full">
            Limpar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TransactionFiltersSheet;