import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Bell, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import AdminNavLinks from "./AdminNavLinks";
import AdminUserCard from "./AdminUserCard";
import AdminHeader from "./AdminHeader";
import BottomNav from "./AdminBottomNav";

const AdminLayout = () => {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Fixed Desktop Sidebar */}
      <div className="hidden md:flex md:w-[220px] lg:w-[280px] md:flex-col md:fixed md:inset-y-0 md:z-50 border-r bg-card">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/admin" className="flex items-center gap-2 font-semibold">
              <Package className="h-6 w-6" />
              <span>Admin Panel</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Alternar notificações</span>
            </Button>
          </div>
          
          {/* Botão para voltar ao painel financeiro */}
          <div className="px-2 lg:px-4">
            <Button asChild variant="outline" className="w-full justify-start gap-2" size="sm">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Painel Financeiro
              </Link>
            </Button>
          </div>
          
          <AdminUserCard />
          
          <div className="flex-1 overflow-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <AdminNavLinks />
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              to="/admin"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <Package className="h-6 w-6" />
              <span>Admin Panel</span>
            </Link>
            
            <Button asChild variant="outline" className="w-full justify-start gap-2 mb-4" size="sm">
              <Link to="/" onClick={() => setMobileSidebarOpen(false)}>
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Painel Financeiro
              </Link>
            </Button>
            
            <AdminUserCard />
            
            <div onClick={() => setMobileSidebarOpen(false)}>
              <AdminNavLinks />
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-[220px] lg:ml-[280px]">
        <AdminHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pb-20 md:pb-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      
      <BottomNav onMenuClick={() => setMobileSidebarOpen(true)} />
    </div>
  );
};

export default AdminLayout;