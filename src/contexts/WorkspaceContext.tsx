"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceWithRole } from '@/types/workspace';
import { useSession } from './SessionContext';
import { showError } from '@/utils/toast';

interface WorkspaceContextType {
  currentWorkspace: WorkspaceWithRole | null;
  workspaces: WorkspaceWithRole[];
  loading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string, isShared?: boolean) => Promise<Workspace | null>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useSession();
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    if (!session?.user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      // Buscar workspaces onde o usuário é owner ou membro
      const { data: workspacesData, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_users!inner(role)
        `)
        .or(`created_by.eq.${session.user.id},workspace_users.user_id.eq.${session.user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedWorkspaces: WorkspaceWithRole[] = workspacesData?.map(workspace => {
        const isOwner = workspace.created_by === session.user.id;
        const userRole = isOwner ? 'owner' : workspace.workspace_users[0]?.role || 'user';
        
        return {
          ...workspace,
          user_role: userRole as 'admin' | 'user' | 'owner',
          is_owner: isOwner
        };
      }) || [];

      setWorkspaces(formattedWorkspaces);

      // Se não há workspace atual, selecionar o primeiro
      if (!currentWorkspace && formattedWorkspaces.length > 0) {
        const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
        const workspaceToSelect = savedWorkspaceId 
          ? formattedWorkspaces.find(w => w.id === savedWorkspaceId) || formattedWorkspaces[0]
          : formattedWorkspaces[0];
        
        setCurrentWorkspace(workspaceToSelect);
        localStorage.setItem('currentWorkspaceId', workspaceToSelect.id);
      }
    } catch (error: any) {
      console.error('Error fetching workspaces:', error);
      showError('Erro ao carregar núcleos financeiros');
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem('currentWorkspaceId', workspaceId);
    }
  };

  const createWorkspace = async (name: string, description?: string, isShared: boolean = false): Promise<Workspace | null> => {
    if (!session?.user) return null;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          description,
          created_by: session.user.id,
          is_shared: isShared
        })
        .select()
        .single();

      if (error) throw error;

      // Se é um workspace compartilhado, adicionar o criador como admin
      if (isShared) {
        await supabase
          .from('workspace_users')
          .insert({
            workspace_id: data.id,
            user_id: session.user.id,
            role: 'admin'
          });
      }

      await fetchWorkspaces();
      return data;
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      showError('Erro ao criar núcleo financeiro');
      return null;
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
    }
  }, [session]);

  const value = {
    currentWorkspace,
    workspaces,
    loading,
    switchWorkspace,
    refreshWorkspaces: fetchWorkspaces,
    createWorkspace
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};