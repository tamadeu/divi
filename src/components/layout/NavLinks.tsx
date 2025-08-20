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
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";

const NavLinks = () => {
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const [transactionCount, setTransactionCount] = useState(0);

  useEffect(() => {
    const fetchTransactionCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count, error } = await supabase
          .from("transactions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching transaction count:", error);
        } else {
          setTransactionCount(count || 0);
        }
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
  }, []);

  const navItems = [
    { to: "/", icon: Home, label: "Painel" },
    {
      to: "/transactions",
      icon: ShoppingCart,
      label: "Transações",
      badge: transactionCount,
    },
    { to: "/accounts", icon: Package, label: "Contas" },
    { to: "/categories", icon: Tags, label: "Categorias" },
    { to: "/budgets", icon: Users, label: "Orçamentos" },
    { to: "/reports", icon: LineChart, label: "Relatórios" },
    { to: "/settings", icon: Settings, label: "Configurações" },
  ];

  // Adicionar item admin se o usuário for admin
  if (isAdmin) {
    navItems.splice(-1, 0, { 
      to: "/admin", 
      icon: Shield, 
      label: "Administração" 
    });
  }

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