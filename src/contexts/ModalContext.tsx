import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction } from '@/types/database';

interface ModalContextType {
  // Add Transaction Modal
  isAddTransactionModalOpen: boolean;
  openAddTransactionModal: (initialData?: any) => void;
  closeAddTransactionModal: () => void;
  addTransactionInitialData: any;

  // Edit Transaction Modal
  isEditTransactionModalOpen: boolean;
  openEditTransactionModal: (transaction: Transaction) => void;
  closeEditTransactionModal: () => void;
  editTransactionData: Transaction | null;

  // Transaction Details Modal
  isTransactionDetailsModalOpen: boolean;
  openTransactionDetailsModal: (transaction: Transaction) => void;
  closeTransactionDetailsModal: () => void;
  transactionDetailsData: Transaction | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  // Add Transaction Modal
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [addTransactionInitialData, setAddTransactionInitialData] = useState<any>(null);

  // Edit Transaction Modal
  const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
  const [editTransactionData, setEditTransactionData] = useState<Transaction | null>(null);

  // Transaction Details Modal
  const [isTransactionDetailsModalOpen, setIsTransactionDetailsModalOpen] = useState(false);
  const [transactionDetailsData, setTransactionDetailsData] = useState<Transaction | null>(null);

  const openAddTransactionModal = (initialData?: any) => {
    setAddTransactionInitialData(initialData);
    setIsAddTransactionModalOpen(true);
  };

  const closeAddTransactionModal = () => {
    setIsAddTransactionModalOpen(false);
    setAddTransactionInitialData(null);
  };

  const openEditTransactionModal = (transaction: Transaction) => {
    setEditTransactionData(transaction);
    setIsEditTransactionModalOpen(true);
  };

  const closeEditTransactionModal = () => {
    setIsEditTransactionModalOpen(false);
    setEditTransactionData(null);
  };

  const openTransactionDetailsModal = (transaction: Transaction) => {
    setTransactionDetailsData(transaction);
    setIsTransactionDetailsModalOpen(true);
  };

  const closeTransactionDetailsModal = () => {
    setIsTransactionDetailsModalOpen(false);
    setTransactionDetailsData(null);
  };

  return (
    <ModalContext.Provider
      value={{
        // Add Transaction Modal
        isAddTransactionModalOpen,
        openAddTransactionModal,
        closeAddTransactionModal,
        addTransactionInitialData,

        // Edit Transaction Modal
        isEditTransactionModalOpen,
        openEditTransactionModal,
        closeEditTransactionModal,
        editTransactionData,

        // Transaction Details Modal
        isTransactionDetailsModalOpen,
        openTransactionDetailsModal,
        closeTransactionDetailsModal,
        transactionDetailsData,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};