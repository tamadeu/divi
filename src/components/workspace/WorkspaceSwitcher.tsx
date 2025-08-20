"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Users, User } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import CreateWorkspaceModal from "./CreateWorkspaceModal";

const WorkspaceSwitcher = () => {
  const { currentWorkspace, workspaces, switchWorkspace, loading } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (loading || !currentWorkspace) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-6 w-6 rounded bg-muted animate-pulse" />
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between px-3 py-2 h-auto"
          >
            <div className="flex items-center gap-2 min-w-0">
              {currentWorkspace.is_shared ? (
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate text-sm font-medium">
                {currentWorkspace.name}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Buscar núcleo financeiro..." />
            <CommandList>
              <CommandEmpty>Nenhum núcleo encontrado.</CommandEmpty>
              <CommandGroup heading="Núcleos Financeiros">
                {workspaces.map((workspace) => (
                  <CommandItem
                    key={workspace.id}
                    value={workspace.name}
                    onSelect={() => {
                      switchWorkspace(workspace.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {workspace.is_shared ? (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{workspace.name}</div>
                        {workspace.description && (
                          <div className="truncate text-xs text-muted-foreground">
                            {workspace.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        currentWorkspace.id === workspace.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowCreateModal(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Núcleo Financeiro
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
};

export default WorkspaceSwitcher;