import { Bell, Home, LineChart, Package, Settings, ShoppingCart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { allTransactions } from "@/data/mockData";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { to: "/", icon: Home, label: "Painel" },
    { to: "/transactions", icon: ShoppingCart, label: "Transações", badge: allTransactions.length },
    { to: "#", icon: Package, label: "Contas" },
    { to: "#", icon: Users, label: "Orçamentos" },
    { to: "#", icon: LineChart, label: "Relatórios" },
    { to: "/settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Package className="h-6 w-6" />
            <span className="">Finance Inc</span>
          </Link>
          <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Alternar notificações</span>
          </Button>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  location.pathname === item.to && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge && (
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;