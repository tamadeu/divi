import { Bell, Package, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import NavLinks from "./NavLinks";
import UserCard from "./UserCard";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Sidebar = () => {
  const { getPlatformName, getPlatformLogo, loading } = usePublicPlatformSettings();
  
  const handleRefresh = () => {
    window.location.reload();
  };

  const platformName = getPlatformName();
  const platformLogo = getPlatformLogo();

  // Don't render the name if it's empty or still loading
  const shouldShowName = !loading && platformName;

  return (
    <div className="flex h-full w-full flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          {platformLogo ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={platformLogo} alt={platformName || 'Logo'} />
              <AvatarFallback>
                <Package className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <Package className="h-6 w-6" />
          )}
          {shouldShowName && <span>{platformName}</span>}
        </Link>
        <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Alternar notificações</span>
        </Button>
      </div>
      
      <UserCard />
      
      <div className="flex-1 overflow-auto">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          <NavLinks />
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;