import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AddTransactionData {
  amount?: number;
  type?: 'income' | 'expense';
  description?: string;
  category_id?: string;
  account_id?: string;
}

interface AddTransferData {
  fromAccountId?: string;
  toAccountId?: string;
  amount?: number;
}

interface ModalContextType {
  // Add Transaction Modal
  isAddTransactionModalOpen: boolean;
  openAddTransactionModal: (initialData?: AddTransactionData) => void;
  closeAddTransactionModal: () => void;
  onTransactionAdded: () => void;
  addTransactionInitialData: AddTransactionData | undefined;

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

  // Add Account Modal State
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);

  // Add Category Modal State
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // Add Transfer Modal State
  const [isAddTransferModalOpen, setIsAddTransferModalOpen] = useState(false);
  const [addTransferInitialData, setAddTransferInitialData] = useState<AddTransferData | undefined>();

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

  const value: ModalContextType = {
    // Add Transaction Modal
    isAddTransactionModalOpen,
    openAddTransactionModal,
    closeAddTransactionModal,
    onTransactionAdded,
    addTransactionInitialData,

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
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};
</ModalContext.Provider>