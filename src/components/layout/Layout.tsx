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
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Layout = () => {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  const { getPlatformName, getPlatformLogo, loading } = usePublicPlatformSettings();
  const {
    isAddTransactionModalOpen,
    closeAddTransactionModal,
    addTransactionInitialData,
    isAddAccountModalOpen,
    closeAddAccountModal,
    isAddCategoryModalOpen,
    closeAddCategoryModal,
    isAddTransferModalOpen,
    closeAddTransferModal,
    addTransferInitialData,
  } = useModal();

  const platformName = getPlatformName();
  const platformLogo = getPlatformLogo();

  // Don't render the name if it's empty or still loading
  const shouldShowName = !loading && platformName;

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  // Function to trigger refresh in child components
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handler functions that trigger refresh
  const handleTransactionAdded = () => {
    triggerRefresh();
  };

  const handleAccountAdded = () => {
    triggerRefresh();
  };

  const handleCategoryAdded = () => {
    triggerRefresh();
  };

  const handleTransferAdded = () => {
    triggerRefresh();
  };

  return (
    <>
      <div className="flex min-h-screen w-full">
        {/* Fixed Sidebar for Desktop */}
        <div className="hidden md:flex md:w-[220px] lg:w-[280px] md:flex-col md:fixed md:inset-y-0 md:z-50">
          <Sidebar />
        </div>
        
        {/* Mobile Sidebar */}
        <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="flex flex-col w-full p-0">
            <div className="flex flex-col h-full">
              {/* Header do sidebar mobile com logo da plataforma */}
              <div className="flex items-center justify-between p-4 border-b">
                <Link
                  to="/"
                  onClick={closeMobileSidebar}
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  {platformLogo ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={platformLogo} alt={platformName || 'Logo'} />
                      <AvatarFallback>
                        <Package2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Package2 className="h-6 w-6" />
                  )}
                  {shouldShowName && <span>{platformName}</span>}
                </Link>
              </div>
              
              {/* Card do usuário */}
              <div className="p-2">
                <UserCard onActionClick={closeMobileSidebar} />
              </div>
              
              {/* Links de navegação */}
              <nav className="flex-1 px-4 pb-4">
                <NavLinks onLinkClick={closeMobileSidebar} />
              </nav>

              {/* Theme Toggle for mobile */}
              <div className="border-t p-4">
                <ThemeToggle variant="compact" />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 md:ml-[220px] lg:ml-[280px]">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-4 lg:p-6 pb-20 md:pb-6">
              <Outlet key={refreshTrigger} />
            </div>
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
        onTransactionAdded={handleTransactionAdded}
        initialData={addTransactionInitialData}
      />
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={closeAddAccountModal}
        onAccountAdded={handleAccountAdded}
      />
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={closeAddCategoryModal}
        onCategoryAdded={handleCategoryAdded}
      />
      <TransferModal
        isOpen={isAddTransferModalOpen}
        onClose={closeAddTransferModal}
        onTransferCompleted={handleTransferAdded}
        initialTransferData={addTransferInitialData}
      />
    </>
  );
};

export default Layout;