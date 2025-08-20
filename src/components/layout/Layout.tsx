"use client";

import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  CircleUser,
  Home,
  LineChart,
  Menu,
  Package,
  Package2,
  Search,
  ShoppingCart,
  Users,
  Wallet,
  Landmark,
  CreditCard, // Import CreditCard icon
  DollarSign,
  ListChecks,
  Settings,
  BarChart3,
  LayoutDashboard,
  ArrowRightLeft,
  Mic,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import TransferModal from "@/components/transfers/TransferModal";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { Skeleton } from "../ui/skeleton";
import VoiceTransactionButton from "../transactions/VoiceTransactionButton";

const Layout = () => {
  const { session, signOut, profile, loading: sessionLoading } = useSession();
  const { openAddTransactionModal, openAddTransferModal, isAddTransactionModalOpen, isAddTransferModalOpen } = useModal();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navigationItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transações", href: "/transactions", icon: DollarSign },
    { name: "Contas", href: "/accounts", icon: Wallet },
    { name: "Cartões de Crédito", href: "/credit-cards", icon: CreditCard }, // New navigation item
    { name: "Categorias", href: "/categories", icon: ListChecks },
    { name: "Orçamentos", href: "/budgets", icon: Package },
    { name: "Relatórios", href: "/reports", icon: BarChart3 },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">Finanças Pessoais</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                    location.pathname === item.href ? "bg-muted text-primary" : ""
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            {sessionLoading || workspaceLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <WorkspaceSwitcher />
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  to="#"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Package2 className="h-6 w-6" />
                  <span className="sr-only">Finanças Pessoais</span>
                </Link>
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${
                      location.pathname === item.href ? "bg-muted text-foreground" : ""
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto">
                {sessionLoading || workspaceLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <WorkspaceSwitcher />
                )}
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar transações..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <VoiceTransactionButton />
            <Button
              variant="secondary"
              size="sm"
              className="gap-1"
              onClick={openAddTransferModal}
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Transferência</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-1"
              onClick={openAddTransactionModal}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Transação</span>
            </Button>
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <CircleUser className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {profile?.first_name || "Meu Perfil"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Configurações</Link>
                </DropdownMenuItem>
                {profile?.user_type === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </div>
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => {
          // This will be handled by ModalContext
        }}
        onTransactionAdded={() => {
          // This will be handled by ModalContext
        }}
      />
      <TransferModal
        isOpen={isAddTransferModalOpen}
        onClose={() => {
          // This will be handled by ModalContext
        }}
        onTransferCompleted={() => {
          // This will be handled by ModalContext
        }}
      />
    </div>
  );
};

export default Layout;