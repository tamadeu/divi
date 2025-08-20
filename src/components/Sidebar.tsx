import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  ArrowRightLeft,
  Wallet,
  Tag,
  Target,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  Building2,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Transações", href: "/transactions", icon: ArrowRightLeft },
  { name: "Contas", href: "/accounts", icon: Wallet },
  { name: "Categorias", href: "/categories", icon: Tag },
  { name: "Orçamentos", href: "/budgets", icon: Target },
  { name: "Cartões de Crédito", href: "/credit-cards", icon: CreditCard },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
  { name: "Núcleos Financeiros", href: "/workspaces", icon: Building2 },
  { name: "Configurações", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

const SidebarContent = () => {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Wallet className="h-6 w-6" />
          <span>FinanceApp</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
};

const Sidebar = ({ className }: SidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
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
        <SheetContent side="left" className="flex flex-col p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={cn("hidden border-r bg-muted/40 md:block", className)}>
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;