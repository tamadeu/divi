import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type SuccessCallback = () => void;

interface ModalContextType {
  isAddTransactionModalOpen: boolean;
  openAddTransactionModal: (onSuccess?: SuccessCallback) => void;
  closeAddTransactionModal: () => void;
  onTransactionAdded: SuccessCallback;

  isAddAccountModalOpen: boolean;
  openAddAccountModal: (onSuccess?: SuccessCallback) => void;
  closeAddAccountModal: () => void;
  onAccountAdded: SuccessCallback;

  isAddCategoryModalOpen: boolean;
  openAddCategoryModal: (onSuccess?: SuccessCallback) => void;
  closeAddCategoryModal: () => void;
  onCategoryAdded: SuccessCallback;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isAddTransactionModalOpen, setAddTransactionModalOpen] = useState(false);
  const [onTransactionAdded, setOnTransactionAdded] = useState<SuccessCallback>(() => () => {});

  const [isAddAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [onAccountAdded, setOnAccountAdded] = useState<SuccessCallback>(() => () => {});

  const [isAddCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [onCategoryAdded, setOnCategoryAdded] = useState<SuccessCallback>(() => () => {});

  const openAddTransactionModal = useCallback((onSuccess: SuccessCallback = () => window.location.reload()) => {
    setOnTransactionAdded(() => onSuccess);
    setAddTransactionModalOpen(true);
  }, []);

  const openAddAccountModal = useCallback((onSuccess: SuccessCallback = () => window.location.reload()) => {
    setOnAccountAdded(() => onSuccess);
    setAddAccountModalOpen(true);
  }, []);

  const openAddCategoryModal = useCallback((onSuccess: SuccessCallback = () => window.location.reload()) => {
    setOnCategoryAdded(() => onSuccess);
    setAddCategoryModalOpen(true);
  }, []);

  const value = {
    isAddTransactionModalOpen,
    openAddTransactionModal,
    closeAddTransactionModal: () => setAddTransactionModalOpen(false),
    onTransactionAdded,

    isAddAccountModalOpen,
    openAddAccountModal,
    closeAddAccountModal: () => setAddAccountModalOpen(false),
    onAccountAdded,

    isAddCategoryModalOpen,
    openAddCategoryModal,
    closeAddCategoryModal: () => setAddCategoryModalOpen(false),
    onCategoryAdded,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};