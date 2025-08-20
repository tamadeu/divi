import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useNavigate } from "react-router-dom";

interface WorkspaceSwitcherProps {
  onWorkspaceChange?: () => void;
}

const WorkspaceSwitcher = ({ onWorkspaceChange }: WorkspaceSwitcherProps = {}) => {
  const [open, setOpen] = useState(false);
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const handleWorkspaceSelect = async (workspaceId: string) => {
    await switchWorkspace(workspaceId);
    setOpen(false);
    onWorkspaceChange?.();
  };

  const handleManageWorkspaces = () => {
    navigate('/settings#workspace-management');
    setOpen(false);
    onWorkspaceChange?.();
  };

  const handleCreateWorkspace = () => {
    navigate('/workspaces/new');
    setOpen(false);
    onWorkspaceChange?.();
  };

  if (!currentWorkspace) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{currentWorkspace.name}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar núcleo..." />
          <CommandList>
            <CommandEmpty>Nenhum núcleo encontrado.</CommandEmpty>
            <CommandGroup heading="Núcleos Financeiros">
              {workspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  value={workspace.id}
                  onSelect={() => handleWorkspaceSelect(workspace.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentWorkspace.id === workspace.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{workspace.name}</span>
                    {workspace.description && (
                      <span className="text-xs text-muted-foreground">
                        {workspace.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleManageWorkspaces}>
                <Settings className="mr-2 h-4 w-4" />
                Gerenciar Núcleos
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default WorkspaceSwitcher;