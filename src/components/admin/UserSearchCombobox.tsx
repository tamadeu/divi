"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/integrations/supabase/client"

interface User {
  id: string;
  email: string;
  // Changed from 'profile' to 'profiles'
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    user_type: string | null;
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
      console.log('🔍 Searching for:', query)
      
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        body: { search: query, limit: 10 }
      })

      console.log('📡 Search response:', data, error)

      if (error) {
        console.error('❌ Error searching users:', error)
        setUsers([])
        return
      }

      if (data && data.users) {
        console.log('✅ Setting users:', data.users.length, 'users found')
        setUsers(data.users)
      } else {
        console.log('⚠️ No users in response')
        setUsers([])
      }
    } catch (error) {
      console.error('💥 Error in searchUsers:', error)
      setUsers([])
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
    // Use user.profiles instead of user.profile
    const profile = user.profiles 
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.first_name) {
      return profile.first_name
    }
    return user.email.split('@')[0]
  }

  const getDisplayText = (user: User) => {
    const name = getDisplayName(user)
    return name !== user.email.split('@')[0] ? `${name} (${user.email})` : user.email
  }

  const handleSelectUser = (user: User) => {
    console.log('👤 Selecting user:', user.id, user.email)
    onValueChange(user.id === value ? null : user.id)
    setOpen(false)
  }

  const handleClearSelection = () => {
    console.log('🗑️ Clearing selection')
    onValueChange(null)
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
          <div className="p-3 border-b">
            <Input
              placeholder="Digite email ou nome do usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <ScrollArea className="max-h-[200px]">
            <div className="p-2">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Buscando usuários...</span>
                </div>
              )}
              
              {!loading && searchQuery.length < 2 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Digite pelo menos 2 caracteres
                </div>
              )}
              
              {!loading && searchQuery.length >= 2 && users.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              )}
              
              {!loading && users.length > 0 && (
                <div className="space-y-1">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
                        value === user.id && "bg-accent"
                      )}
                      onClick={() => handleSelectUser(user)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{getDisplayName(user)}</div>
                        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      
      {selectedUser && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearSelection}
          disabled={disabled}
          className="h-10 w-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}