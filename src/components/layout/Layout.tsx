import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import InstallPrompt from "../pwa/InstallPrompt";
import UpdatePrompt from "../pwa/UpdatePrompt";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NavLinks from "./NavLinks";
import { Package2, RotateCcw } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import AddAccountModal from "@/components/accounts/AddAccountModal";
import AddCategoryModal from "@/components/categories/AddCategoryModal";
import AddTransferModal from "@/components/transfers/AddTransferModal";
import UserCard from "./UserCard";
import { Button } from "@/components/ui/button";

const Layout = () => {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const {
    isAddTransactionModalOpen,
    closeAddTransactionModal,
    onTransactionAdded,
    addTransactionInitialData,
    isAddAccountModalOpen,
    closeAddAccountModal,
    onAccountAdded,
    isAddCategoryModalOpen,
    closeAddCategoryModal,
    onCategoryAdded,
    isAddTransferModalOpen,
    closeAddTransferModal,
    onTransferAdded,
  } = useModal();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              <div className="flex items-center justify-between mb-4">
                <Link
                  to="/"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Package2 className="h-6 w-6" />
                  <span>Divi</span>
                </Link>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleRefresh}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sr-only">Atualizar página</span>
                </Button>
              </div>
              <UserCard /> 
              <div onClick={() => setMobileSidebarOpen(false)}>
                <NavLinks />
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex flex-col">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pb-20 md:pb-6 overflow-auto">
            <Outlet />
          </main>
        </div>
        <BottomNav onMenuClick={() => setMobileSidebarOpen(true)} />
      </div>

      {/* PWA Components */}
      <InstallPrompt />
      <UpdatePrompt />

      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={closeAddTransactionModal}
        onTransactionAdded={onTransactionAdded}
        initialData={addTransactionInitialData}
      />
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={closeAddAccountModal}
        onAccountAdded={onAccountAdded}
      />
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={closeAddCategoryModal}
        onCategoryAdded={onCategoryAdded}
      />
      <AddTransferModal
        isOpen={isAddTransferModalOpen}
        onClose={closeAddTransferModal}
        onTransferAdded={onTransferAdded}
      />
    </>
  );
};

export default Layout;