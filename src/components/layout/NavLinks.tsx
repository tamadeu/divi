import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { allTransactions } from "@/data/mockData";
import { cn } from "@/lib/utils";

const NavLinks = () => {
  const location = useLocation();
  const navItems = [
    { to: "/", icon: Home, label: "Painel" },
    {
      to: "/transactions",
      icon: ShoppingCart,
      label: "Transações",
      badge: allTransactions.length,
    },
    { to: "/accounts", icon: Package, label: "Contas" },
    { to: "/budgets", icon: Users, label: "Orçamentos" },
    { to: "/reports", icon: LineChart, label: "Relatórios" },
    { to: "/settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.label}
            to={item.to}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary"
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
        );
      })}
    </>
  );
};

export default NavLinks;