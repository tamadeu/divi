import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction } from '@/types/database';

interface AddTransactionData {
  amount?: number;
  type?: 'income' | 'expense';
  description?: string;
  category_id?: string;
  account_id?: string;
  date?: Date;
}

interface AddTransferData {
  fromAccountId?: string;
  toAccountId?: string;
  amount?: number;
}

interface AddCreditCardTransactionData {
  name?: string;
  amount?: number;
  date?: Date;
  credit_card_id?: string;
  category_id?: string;
  description?: string;
  is_installment_purchase?: boolean;
  installments?: number;
}

interface ModalContextType {
  // Add Transaction Modal
  isAddTransactionModalOpen: boolean;
  openAddTransactionModal: (initialData?: AddTransactionData) => void;
  closeAddTransactionModal: () => void;
  onTransactionAdded: () => void;
  addTransactionInitialData: AddTransactionData | undefined;

  // Transaction Details Modal (now handled by dedicated page)
  // isEditTransactionModalOpen: boolean; // Removed
  // openEditTransactionModal: (transaction: Transaction) => void; // Removed
  // closeEditTransactionModal: () => void; // Removed
  // editTransactionData: Transaction | null; // Removed

  // Transaction Details Modal
  isTransactionDetailsModalOpen: boolean;
  openTransactionDetailsModal: (transaction: Transaction) => void;
  closeTransactionDetailsModal: () => void;
  transactionDetailsData: Transaction | null;

  // Add Account Modal
  isAddAccountModalOpen: boolean;
  openAddAccountModal: () => void;
  closeAddAccountModal: () => void;
  onAccountAdded: () => void;

  // Add Category Modal
  isAddCategoryModalOpen: boolean;
  openAddCategoryModal: () => void;
  closeAddCategoryModal: () => void;
  onCategoryAdded: () => void;

  // Add Transfer Modal
  isAddTransferModalOpen: boolean;
  openAddTransferModal: (initialData?: AddTransferData) => void;
  closeAddTransferModal: () => void;
  onTransferAdded: () => void;
  addTransferInitialData: AddTransferData | undefined;

  // Add Credit Card Transaction Modal
  isAddCreditCardTransactionModalOpen: boolean;
  openAddCreditCardTransactionModal: (initialData?: AddCreditCardTransactionData) => void;
  closeAddCreditCardTransactionModal: () => void;
  onCreditCardTransactionAdded: () => void;
  addCreditCardTransactionInitialData: AddCreditCardTransactionData | undefined;

  // Edit Credit Card Transaction Modal (now handled by dedicated page)
  // isEditCreditCardTransactionModalOpen: boolean; // Removed
  // openEditCreditCardTransactionModal: (transaction: Transaction) => void; // Removed
  // closeEditCreditCardTransactionModal: () => void; // Removed
  // editCreditCardTransactionData: Transaction | null; // Removed
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

export const ModalProvider = ({ children }: ModalProviderProps) => {
  // Add Transaction Modal State
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [addTransactionInitialData, setAddTransactionInitialData] = useState<AddTransactionData | undefined>();

  // Edit Transaction Modal State (Removed)
  // const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
  // const [editTransactionData, setEditTransactionData] = useState<Transaction | null>(null);

  // Transaction Details Modal State
  const [isTransactionDetailsModalOpen, setIsTransactionDetailsModalOpen] = useState(false);
  const [transactionDetailsData, setTransactionDetailsData] = useState<Transaction | null>(null);

  // Add Account Modal State
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);

  // Add Category Modal State
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // Add Transfer Modal State
  const [isAddTransferModalOpen, setIsAddTransferModalOpen] = useState(false);
  const [addTransferInitialData, setAddTransferInitialData] = useState<AddTransferData | undefined>();

  // Add Credit Card Transaction Modal State
  const [isAddCreditCardTransactionModalOpen, setIsAddCreditCardTransactionModalOpen] = useState(false);
  const [addCreditCardTransactionInitialData, setAddCreditCardTransactionInitialData] = useState<AddCreditCardTransactionData | undefined>();

  // Edit Credit Card Transaction Modal State (Removed)
  // const [isEditCreditCardTransactionModalOpen, setIsEditCreditCardTransactionModalOpen] = useState(false);
  // const [editCreditCardTransactionData, setEditCreditCardTransactionData] = useState<Transaction | null>(null);

  // Add Transaction Modal Functions
  const openAddTransactionModal = (initialData?: AddTransactionData) => {
    setAddTransactionInitialData(initialData);
    setIsAddTransactionModalOpen(true);
  };

  const closeAddTransactionModal = () => {
    setIsAddTransactionModalOpen(false);
    setAddTransactionInitialData(undefined);
  };

  const onTransactionAdded = () => {
    // This function can be used to trigger refreshes in components that need it
    // For now, it's just a placeholder that components can override
  };

  // Edit Transaction Modal Functions (Removed)
  // const openEditTransactionModal = (transaction: Transaction) => {
  //   setEditTransactionData(transaction);
  //   setIsEditTransactionModalOpen(true);
  // };

  // const closeEditTransactionModal = () => {
  //   setIsEditTransactionModalOpen(false);
  //   setEditTransactionData(null);
  // };

  // Transaction Details Modal Functions
  const openTransactionDetailsModal = (transaction: Transaction) => {
    setTransactionDetailsData(transaction);
    setIsTransactionDetailsModalOpen(true);
  };

  const closeTransactionDetailsModal = () => {
    setIsTransactionDetailsModalOpen(false);
    setTransactionDetailsData(null);
  };

  // Add Account Modal Functions
  const openAddAccountModal = () => {
    setIsAddAccountModalOpen(true);
  };

  const closeAddAccountModal = () => {
    setIsAddAccountModalOpen(false);
  };

  const onAccountAdded = () => {
    // This function can be used to trigger refreshes in components that need it
    // For now, it's just a placeholder that components can override
  };

  // Add Category Modal Functions
  const openAddCategoryModal = () => {
    setIsAddCategoryModalOpen(true);
  };

  const closeAddCategoryModal = () => {
    setIsAddCategoryModalOpen(false);
  };

  const onCategoryAdded = () => {
    // This function can be used to trigger refreshes in components that need it
    // For now, it's just a placeholder that components can override
  };

  // Add Transfer Modal Functions
  const openAddTransferModal = (initialData?: AddTransferData) => {
    setAddTransferInitialData(initialData);
    setIsAddTransferModalOpen(true);
  };

  const closeAddTransferModal = () => {
    setIsAddTransferModalOpen(false);
    setAddTransferInitialData(undefined);
  };

  const onTransferAdded = () => {
    // This function can be used to trigger refreshes in components that need it
    // For now, it's just a placeholder that components can override
  };

  // Add Credit Card Transaction Modal Functions
  const openAddCreditCardTransactionModal = (initialData?: AddCreditCardTransactionData) => {
    setAddCreditCardTransactionInitialData(initialData);
    setIsAddCreditCardTransactionModalOpen(true);
  };

  const closeAddCreditCardTransactionModal = () => {
    setIsAddCreditCardTransactionModalOpen(false);
    setAddCreditCardTransactionInitialData(undefined);
  };

  const onCreditCardTransactionAdded = () => {
    // This function can be used to trigger refreshes in components that need it
    // For now, it's just a placeholder that components can override
  };

  // Edit Credit Card Transaction Modal Functions (Removed)
  // const openEditCreditCardTransactionModal = (transaction: Transaction) => {
  //   setEditCreditCardTransactionData(transaction);
  //   setIsEditCreditCardTransactionModalOpen(true);
  // };

  // const closeEditCreditCardTransactionModal = () => {
  //   setIsEditCreditCardTransactionModalOpen(false);
  //   setEditCreditCardTransactionData(null);
  // };

  const onCreditCardTransactionUpdated = () => {
    // Placeholder for refresh logic
  };

  const value: ModalContextType = {
    // Add Transaction Modal
    isAddTransactionModalOpen,
    openAddTransactionModal,
    closeAddTransactionModal,
    onTransactionAdded,
    addTransactionInitialData,

    // Transaction Details Modal
    isTransactionDetailsModalOpen,
    openTransactionDetailsModal,
    closeTransactionDetailsModal,
    transactionDetailsData,

    // Add Account Modal
    isAddAccountModalOpen,
    openAddAccountModal,
    closeAddAccountModal,
    onAccountAdded,

    // Add Category Modal
    isAddCategoryModalOpen,
    openAddCategoryModal,
    closeAddCategoryModal,
    onCategoryAdded,

    // Add Transfer Modal
    isAddTransferModalOpen,
    openAddTransferModal,
    closeAddTransferModal,
    onTransferAdded,
    addTransferInitialData,

    // Add Credit Card Transaction Modal
    isAddCreditCardTransactionModalOpen,
    openAddCreditCardTransactionModal,
    closeAddCreditCardTransactionModal,
    onCreditCardTransactionAdded,
    addCreditCardTransactionInitialData,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};