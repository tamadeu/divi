"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Repeat, Wallet, LayoutGrid, BarChart, Settings, DollarSign, X } from "lucide-react";
import UserSidebarProfile from './UserSidebarProfile';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { name: "Painel", href: "/", icon: Home },
  { name: "Transações", href: "/transactions", icon: Repeat },
  { name: "Contas", href: "/accounts", icon: Wallet },
  { name: "Categorias", href: "/categories", icon: LayoutGrid },
  { name: "Orçamentos", href: "/budgets", icon: DollarSign },
  { name: "Relatórios", href: "/reports", icon: BarChart },
  { name: "Configurações", href: "/settings", icon: Settings },
];

const Sidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <img src="/logo.svg" alt="Divi Logo" className="h-6 w-6" /> Divi
        </h2>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      <UserSidebarProfile />

      <nav className="mt-8 flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground hover:bg-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed bottom-4 right-4 z-50 md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          {renderSidebarContent()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-background/50 h-screen fixed top-0 left-0">
      {renderSidebarContent()}
    </aside>
  );
};

export default Sidebar;