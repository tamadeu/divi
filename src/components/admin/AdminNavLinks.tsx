import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Shield,
  Database,
  Settings,
  BarChart3,
  FileText,
  Building2,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AdminNavLinks = () => {
  const location = useLocation();

  const adminNavItems = [
    { to: "/admin", icon: BarChart3, label: "Dashboard" },
    { to: "/admin/users", icon: Users, label: "Usuários" },
    { to: "/admin/banks", icon: Building2, label: "Bancos" },
    { to: "/admin/companies", icon: Building, label: "Empresas" },
    { to: "/admin/system", icon: Database, label: "Sistema" },
    { to: "/admin/reports", icon: FileText, label: "Relatórios" },
    { to: "/admin/settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <>
      {adminNavItems.map((item) => {
        const isActive =
          item.to === "/admin"
            ? location.pathname === "/admin"
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
          </Link>
        );
      })}
    </>
  );
};

export default AdminNavLinks;