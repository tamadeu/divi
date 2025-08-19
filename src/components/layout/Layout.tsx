import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NavLinks from "./NavLinks";
import { Package2 } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import AddAccountModal from "@/components/accounts/AddAccountModal";
import AddCategoryModal from "@/components/categories/AddCategoryModal";

const Layout = () => {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const {
    isAddTransactionModalOpen,
    closeAddTransactionModal,
    onTransactionAdded,
    isAddAccountModalOpen,
    closeAddAccountModal,
    onAccountAdded,
    isAddCategoryModalOpen,
    closeAddCategoryModal,
    onCategoryAdded,
  } = useModal();

  return (
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              <Link
                to="/"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-2 text-lg font-semibold mb-4"
              >
                <Package2 className="h-6 w-6" />
                <span>Finance Inc</span>
              </Link>
              <div onClick={() => setMobileSidebarOpen(false)}>
                <NavLinks />
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex flex-col">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
        <BottomNav onMenuClick={() => setMobileSidebarOpen(true)} />
      </div>

      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={closeAddTransactionModal}
        onTransactionAdded={onTransactionAdded}
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
    </>
  );
};

export default Layout;