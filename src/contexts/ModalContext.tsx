import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type SuccessCallback = () => void;

interface ModalContextType {
  isAddTransactionModalOpen: boolean;
  openAddTransactionModal: (onSuccess?: SuccessCallback, initialData?: any) => void;
  closeAddTransactionModal: () => void;
  onTransactionAdded: SuccessCallback;
  addTransactionInitialData: any;

  isAddAccountModalOpen: boolean;
  openAddAccountModal: (onSuccess?: SuccessCallback) => void;
  closeAddAccountModal: () => void;
  onAccountAdded: SuccessCallback;

  isAddCategoryModalOpen: boolean;
  openAddCategoryModal: (onSuccess?: SuccessCallback) => void;
  closeAddCategoryModal: () => void;
  onCategoryAdded: SuccessCallback;

  isAddTransferModalOpen: boolean;
  openAddTransferModal: (onSuccess?: SuccessCallback) => void;
  closeAddTransferModal: () => void;
  onTransferAdded: SuccessCallback;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isAddTransactionModalOpen, setAddTransactionModalOpen] = useState(false);
  const [onTransactionAdded, setOnTransactionAdded] = useState<SuccessCallback>(() => () => {});
  const [addTransactionInitialData, setAddTransactionInitialData] = useState<any>(null);

  const [isAddAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [onAccountAdded, setOnAccountAdded] = useState<SuccessCallback>(() => () => {});

  const [isAddCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [onCategoryAdded, setOnCategoryAdded] = useState<SuccessCallback>(() => () => {});

  const [isAddTransferModalOpen, setAddTransferModalOpen] = useState(false);
  const [onTransferAdded, setOnTransferAdded] = useState<SuccessCallback>(() => () => {});

  const openAddTransactionModal = useCallback((onSuccess: SuccessCallback = () => window.location.reload(), initialData: any = null) => {
    setOnTransactionAdded(() => onSuccess);
    setAddTransactionInitialData(initialData);
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

  const openAddTransferModal = useCallback((onSuccess: SuccessCallback = () => window.location.reload()) => {
    setOnTransferAdded(() => onSuccess);
    setAddTransferModalOpen(true);
  }, []);

  const value = {
    isAddTransactionModalOpen,
    openAddTransactionModal,
    closeAddTransactionModal: () => setAddTransactionModalOpen(false),
    onTransactionAdded,
    addTransactionInitialData,

    isAddAccountModalOpen,
    openAddAccountModal,
    closeAddAccountModal: () => setAddAccountModalOpen(false),
    onAccountAdded,

    isAddCategoryModalOpen,
    openAddCategoryModal,
    closeAddCategoryModal: () => setAddCategoryModalOpen(false),
    onCategoryAdded,

    isAddTransferModalOpen,
    openAddTransferModal,
    closeAddTransferModal: () => setAddTransferModalOpen(false),
    onTransferAdded,
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