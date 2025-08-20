import { useState } from "react";
import { Check, ChevronsUpDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useNavigate } from "react-router-dom";

interface WorkspaceSwitcherProps {
  onWorkspaceChange?: () => void;
}

const WorkspaceSwitcher = ({ onWorkspaceChange }: WorkspaceSwitcherProps = {}) => {
  const { workspaces, currentWorkspace, switchWorkspace, loading } = useWorkspace();
  const navigate = useNavigate();

  const handleWorkspaceSelect = (workspaceId: string) => {
    console.log('Selecting workspace:', workspaceId);
    switchWorkspace(workspaceId);
    onWorkspaceChange?.();
  };

  const handleManageWorkspaces = () => {
    navigate('/settings');
    onWorkspaceChange?.();
  };

  const isDisabled = loading || workspaces.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={isDisabled}
        >
          <span className="truncate">
            {currentWorkspace?.name || "Selecionar núcleo..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[200px]" align="start">
        <DropdownMenuLabel>Núcleos Financeiros</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.length === 0 ? (
          <DropdownMenuItem disabled>
            Nenhum núcleo encontrado
          </DropdownMenuItem>
        ) : (
          workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleWorkspaceSelect(workspace.id)}
              className="flex items-center gap-2"
            >
              <Check
                className={cn(
                  "h-4 w-4",
                  currentWorkspace?.id === workspace.id ? "opacity-100" : "opacity-0"
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
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleManageWorkspaces}>
          <Settings className="mr-2 h-4 w-4" />
          Gerenciar Núcleos
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceSwitcher;