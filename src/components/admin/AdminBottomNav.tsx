import { Link, useLocation } from "react-router-dom";
import { Users, BarChart3, Building2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminBottomNavProps {
  onMenuClick: () => void;
}

const AdminBottomNav = ({ onMenuClick }: AdminBottomNavProps) => {
  const location = useLocation();

  const navItems = [
    { to: "/admin", icon: BarChart3, label: "Dashboard" },
    { to: "/admin/users", icon: Users, label: "Usuários" },
    { to: "/admin/banks", icon: Building2, label: "Bancos" },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-card md:hidden">
      <div className="grid h-full grid-cols-4">
        {navItems.map((item) => (
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

export default AdminBottomNav;