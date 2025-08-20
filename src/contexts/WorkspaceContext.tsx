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
      // Primeiro, buscar workspaces onde o usuário é owner
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: true });

      if (ownedError) throw ownedError;

      // Depois, buscar workspaces onde o usuário é membro
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_users!inner(role)
        `)
        .eq('workspace_users.user_id', session.user.id)
        .neq('created_by', session.user.id) // Excluir os que já são owned
        .order('created_at', { ascending: true });

      if (memberError) throw memberError;

      // Combinar os resultados
      const allWorkspaces = [
        ...(ownedWorkspaces || []).map(workspace => ({
          ...workspace,
          user_role: 'owner' as const,
          is_owner: true,
          workspace_users: []
        })),
        ...(memberWorkspaces || []).map(workspace => ({
          ...workspace,
          user_role: workspace.workspace_users[0]?.role || 'user' as const,
          is_owner: false
        }))
      ];

      setWorkspaces(allWorkspaces);

      // Se não há workspace atual, selecionar o primeiro
      if (!currentWorkspace && allWorkspaces.length > 0) {
        const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
        const workspaceToSelect = savedWorkspaceId 
          ? allWorkspaces.find(w => w.id === savedWorkspaceId) || allWorkspaces[0]
          : allWorkspaces[0];
        
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