"use client";

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ArrowUpDown,
  CreditCard,
  PieChart,
  Settings,
  Menu,
  X,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import WorkspaceSwitcher from "./workspace/WorkspaceSwitcher";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Transações", href: "/transactions", icon: ArrowUpDown, badge: true },
  { name: "Contas", href: "/accounts", icon: CreditCard },
  { name: "Orçamentos", href: "/budgets", icon: Target },
  { name: "Relatórios", href: "/reports", icon: PieChart },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
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
        .eq("user_id", user.id)
        .eq("workspace_id", currentWorkspace.id);

      if (error) {
        console.error("Error fetching transaction count:", error);
        setTransactionCount(0);
      } else {
        setTransactionCount(count || 0);
      }
    };

    fetchTransactionCount();
  }, [currentWorkspace]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="bg-background"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-background border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <PieChart className="h-6 w-6" />
              <span>FinanceApp</span>
            </Link>
          </div>

          {/* Workspace Switcher */}
          <div className="border-b p-4">
            <WorkspaceSwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 lg:px-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                      {item.badge && transactionCount > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {transactionCount}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}