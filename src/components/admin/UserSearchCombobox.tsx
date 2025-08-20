"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/integrations/supabase/client"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string;
  email: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface UserSearchComboboxProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UserSearchCombobox({
  value,
  onValueChange,
  placeholder = "Buscar usuário...",
  disabled = false
}: UserSearchComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedUser = users.find(user => user.id === value)

  const searchUsers = React.useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([])
      return
    }

    setLoading(true)
    try {
      // Use the admin function to search users
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        body: { search: query, limit: 10 }
      })

      if (error) {
        console.error('Error searching users:', error)
        return
      }

      setUsers(data.users || [])
    } catch (error) {
      console.error('Error in searchUsers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchUsers])

  const getDisplayName = (user: User) => {
    if (user.profiles?.first_name && user.profiles?.last_name) {
      return `${user.profiles.first_name} ${user.profiles.last_name}`
    }
    if (user.profiles?.first_name) {
      return user.profiles.first_name
    }
    return user.email.split('@')[0]
  }

  const getDisplayText = (user: User) => {
    const name = getDisplayName(user)
    return name !== user.email.split('@')[0] ? `${name} (${user.email})` : user.email
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
            disabled={disabled}
          >
            {selectedUser ? (
              <span className="truncate">{getDisplayText(selectedUser)}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Digite email ou nome do usuário..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandEmpty>
              {loading ? "Buscando usuários..." : searchQuery.length < 2 ? "Digite pelo menos 2 caracteres" : "Nenhum usuário encontrado."}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? null : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{getDisplayName(user)}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedUser && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onValueChange(null)}
          disabled={disabled}
          className="h-10 w-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}