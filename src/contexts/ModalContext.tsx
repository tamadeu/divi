"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction, Category } from '@/types/database'; // Assuming Transaction and Category types are available

interface ModalContextType {
  // Add Transaction Modal
  isAddTransactionModalOpen: boolean;
  addTransactionInitialData: any | null;
  openAddTransactionModal: (initialData?: any, callback?: () => void) => void;
  closeAddTransactionModal: () => void;
  onTransactionAdded: () => void; // Callback for when a transaction is added

  // Add Account Modal
  isAddAccountModalOpen: boolean;
  openAddAccountModal: (callback?: () => void) => void;
  closeAddAccountModal: () => void;
  onAccountAdded: () => void; // Callback for when an account is added

  // Add Category Modal
  isAddCategoryModalOpen: boolean;
  openAddCategoryModal: (callback?: (newCategory?: Category) => void) => void;
  closeAddCategoryModal: () => void;
  onCategoryAdded: (newCategory?: Category) => void; // Callback for when a category is added

  // Transfer Modal
  isAddTransferModalOpen: boolean;
  addTransferInitialData: { fromTransaction: Transaction, toTransaction: Transaction } | null;
  openAddTransferModal: (initialData?: { fromTransaction: Transaction, toTransaction: Transaction }, callback?: () => void) => void;
  closeAddTransferModal: () => void;
  onTransferAdded: () => void; // Callback for when a transfer is completed
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  // Add Transaction Modal states
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [addTransactionInitialData, setAddTransactionInitialData] = useState<any | null>(null);
  const [transactionAddedCallback, setTransactionAddedCallback] = useState<(() => void) | null>(null);

  // Add Account Modal states
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [accountAddedCallback, setAccountAddedCallback] = useState<(() => void) | null>(null);

  // Add Category Modal states
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [categoryAddedCallback, setCategoryAddedCallback] = useState<((newCategory?: Category) => void) | null>(null);

  // Transfer Modal states
  const [isAddTransferModalOpen, setIsAddTransferModalOpen] = useState(false);
  const [addTransferInitialData, setAddTransferInitialData] = useState<{ fromTransaction: Transaction, toTransaction: Transaction } | null>(null);
  const [transferAddedCallback, setTransferAddedCallback] = useState<(() => void) | null>(null);

  // Add Transaction Modal functions
  const openAddTransactionModal = (initialData?: any, callback?: () => void) => {
    setAddTransactionInitialData(initialData || null);
    setIsAddTransactionModalOpen(true);
    if (callback) setTransactionAddedCallback(() => callback);
  };
  const closeAddTransactionModal = () => {
    setIsAddTransactionModalOpen(false);
    setAddTransactionInitialData(null);
    setTransactionAddedCallback(null);
  };
  const onTransactionAdded = () => {
    if (transactionAddedCallback) transactionAddedCallback();
  };

  // Add Account Modal functions
  const openAddAccountModal = (callback?: () => void) => {
    setIsAddAccountModalOpen(true);
    if (callback) setAccountAddedCallback(() => callback);
  };
  const closeAddAccountModal = () => {
    setIsAddAccountModalOpen(false);
    setAccountAddedCallback(null);
  };
  const onAccountAdded = () => {
    if (accountAddedCallback) accountAddedCallback();
  };

  // Add Category Modal functions
  const openAddCategoryModal = (callback?: (newCategory?: Category) => void) => {
    setIsAddCategoryModalOpen(true);
    if (callback) setCategoryAddedCallback(() => callback);
  };
  const closeAddCategoryModal = () => {
    setIsAddCategoryModalOpen(false);
    setCategoryAddedCallback(null);
  };
  const onCategoryAdded = (newCategory?: Category) => {
    if (categoryAddedCallback) categoryAddedCallback(newCategory);
  };

  // Transfer Modal functions
  const openAddTransferModal = (initialData?: { fromTransaction: Transaction, toTransaction: Transaction }, callback?: () => void) => {
    setAddTransferInitialData(initialData || null);
    setIsAddTransferModalOpen(true);
    if (callback) setTransferAddedCallback(() => callback);
  };
  const closeAddTransferModal = () => {
    setIsAddTransferModalOpen(false);
    setAddTransferInitialData(null);
    setTransferAddedCallback(null);
  };
  const onTransferAdded = () => {
    if (transferAddedCallback) transferAddedCallback();
  };

  const value = {
    isAddTransactionModalOpen,
    addTransactionInitialData,
    openAddTransactionModal,
    closeAddTransactionModal,
    onTransactionAdded,

    isAddAccountModalOpen,
    openAddAccountModal,
    closeAddAccountModal,
    onAccountAdded,

    isAddCategoryModalOpen,
    openAddCategoryModal,
    closeAddCategoryModal,
    onCategoryAdded,

    isAddTransferModalOpen,
    addTransferInitialData,
    openAddTransferModal,
    closeAddTransferModal,
    onTransferAdded,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};