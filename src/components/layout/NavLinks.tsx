import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Settings,
  Tags,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface NavLinksProps {
  onLinkClick?: () => void;
}

const NavLinks = ({ onLinkClick }: NavLinksProps = {}) => {
  const location = useLocation();
  const [transactionCount, setTransactionCount] = useState(0);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    const fetchTransactionCount = async () => {
      if (!currentWorkspace) {
        setTransactionCount(0);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTransactionCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", currentWorkspace.id);

      if (error) {
        console.error("Error fetching transaction count:", error);
        setTransactionCount(0);
      } else {
        setTransactionCount(count || 0);
      }
    };

    const subscription = supabase
      .channel('transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchTransactionCount)
      .subscribe();

    fetchTransactionCount();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentWorkspace]);

  const navItems = [
    { to: "/", icon: Home, label: "Painel" },
    {
      to: "/transactions",
      icon: ShoppingCart,
      label: "Transações",
      badge: transactionCount,
    },
    { to: "/accounts", icon: Package, label: "Contas" },
    { to: "/credit-cards", icon: CreditCard, label: "Cartões" },
    { to: "/categories", icon: Tags, label: "Categorias" },
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
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-primary text-primary-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.badge && item.badge > 0 ? (
              <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                {item.badge}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </>
  );
};

export default NavLinks;