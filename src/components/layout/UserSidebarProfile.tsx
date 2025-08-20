"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

const UserSidebarProfile = () => {
  const { session } = useSession();
  const [profileName, setProfileName] = useState("Usuário");
  const [initials, setInitials] = useState("U");

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
          setProfileName("Usuário");
          setInitials("U");
        } else if (data) {
          const firstName = data.first_name || '';
          const lastName = data.last_name || '';
          
          let formattedName = firstName;
          let currentInitials = '';

          if (firstName) {
            currentInitials += firstName.charAt(0).toUpperCase();
          }
          if (lastName) {
            formattedName += ` ${lastName.charAt(0).toUpperCase()}.`;
            currentInitials += lastName.charAt(0).toUpperCase();
          } else if (firstName) {
            currentInitials = firstName.length > 1 ? firstName.substring(0, 2).toUpperCase() : firstName.charAt(0).toUpperCase();
          } else {
            currentInitials = "U";
          }

          setProfileName(formattedName.trim());
          setInitials(currentInitials);
        }
      } else {
        setProfileName("Usuário");
        setInitials("U");
      }
    };

    fetchProfile();
  }, [session]);

  return (
    <Card className="p-4 flex items-center space-x-3 bg-background/50 border-none shadow-none">
      <Avatar className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold text-sm truncate">{profileName}</p>
      </div>
      <Button variant="ghost" size="icon" className="shrink-0">
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </Button>
    </Card>
  );
};

export default UserSidebarProfile;