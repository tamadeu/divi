import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, PlusCircle, ArrowRightLeft, Mic, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { useModal } from "@/contexts/ModalContext";
import VoiceTransactionButton from "@/components/transactions/VoiceTransactionButton";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { openAddTransactionModal, openAddAccountModal, openAddCategoryModal, openAddTransferModal } = useModal();

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <div className="w-full flex-1">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar transações..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>
      
      {/* Botão de refresh - apenas mobile */}
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 md:hidden"
        onClick={handleRefresh}
        title="Atualizar página"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      {/* Botões de ação - apenas desktop */}
      <div className="hidden md:flex items-center gap-2">
        <VoiceTransactionButton />
        <Button size="sm" variant="outline" className="gap-1" onClick={() => openAddTransferModal()}>
          <ArrowRightLeft className="h-4 w-4" />
          Transferência
        </Button>
        <Button size="sm" className="gap-1" onClick={() => openAddTransactionModal()}>
          <PlusCircle className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>
    </header>
  );
};

export default Header;