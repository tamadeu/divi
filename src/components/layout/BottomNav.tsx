import { Link, useLocation } from "react-router-dom";
import { Home, LineChart, Menu, Plus, ReceiptText, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useModal } from "@/contexts/ModalContext";
import VoiceTransactionButton from "../transactions/VoiceTransactionButton";

interface BottomNavProps {
  onMenuClick: () => void;
}

const BottomNav = ({ onMenuClick }: BottomNavProps) => {
  const location = useLocation();
  const { openAddTransactionModal, openAddAccountModal, openAddCategoryModal, openAddTransferModal } = useModal();

  const navItems = [
    { to: "/", icon: Home, label: "Painel" },
    { to: "/transactions", icon: ReceiptText, label: "Transações" },
    { to: "/reports", icon: LineChart, label: "Relatórios" },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-card md:hidden">
      <div className="grid h-full grid-cols-5">
        {navItems.slice(0, 2).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "inline-flex flex-col items-center justify-center px-5 hover:bg-muted",
              location.pathname === item.to ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}

        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="w-14 h-14 rounded-full -translate-y-4 shadow-lg">
                <Plus className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="mb-2 w-56">
              <DropdownMenuItem className="p-0">
                <VoiceTransactionButton />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openAddTransactionModal()}>Nova Transação</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAddTransferModal()}>Nova Transferência</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAddAccountModal()}>Nova Conta</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAddCategoryModal()}>Nova Categoria</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {navItems.slice(2).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "inline-flex flex-col items-center justify-center px-5 hover:bg-muted",
              location.pathname === item.to ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}

        <button
          onClick={onMenuClick}
          className="inline-flex flex-col items-center justify-center px-5 text-muted-foreground hover:bg-muted"
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-xs">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;