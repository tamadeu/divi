import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import InstallPrompt from "../pwa/InstallPrompt";
import UpdatePrompt from "../pwa/UpdatePrompt";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NavLinks from "./NavLinks";
import { Package2 } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import AddAccountModal from "@/components/accounts/AddAccountModal";
import AddCategoryModal from "@/components/categories/AddCategoryModal";
import TransferModal from "@/components/transfers/TransferModal";
import UserCard from "./UserCard";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Layout = () => {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { getPlatformName, getPlatformLogo } = usePublicPlatformSettings();
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
    addTransferInitialData,
  } = useModal();

  const platformName = getPlatformName();
  const platformLogo = getPlatformLogo();

  return (
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="flex flex-col w-[280px] sm:w-[350px]">
            <nav className="grid gap-2 text-lg font-medium">
              {/* Header do sidebar mobile com logo da plataforma */}
              <div className="flex items-center mb-4 pb-2 border-b">
                <Link
                  to="/"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  {platformLogo ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={platformLogo} alt={platformName} />
                      <AvatarFallback>
                        <Package2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Package2 className="h-6 w-6" />
                  )}
                  <span>{platformName}</span>
                </Link>
              </div>
              
              {/* Card do usuário */}
              <div className="mb-4">
                <UserCard />
              </div>
              
              {/* Links de navegação */}
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
      <TransferModal
        isOpen={isAddTransferModalOpen}
        onClose={closeAddTransferModal}
        onTransferCompleted={onTransferAdded}
        initialTransferData={addTransferInitialData}
      />
    </>
  );
};

export default Layout;