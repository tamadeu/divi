"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  const { session, loading: sessionLoading } = useSession();
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    if (!session?.user || sessionLoading) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Buscar workspaces onde o usuário é owner
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: true });

      if (ownedError) {
        console.error('Error fetching owned workspaces:', ownedError);
        throw ownedError;
      }

      // Buscar workspaces onde o usuário é membro (mas NÃO é owner)
      const { data: memberWorkspaceUsers, error: memberError } = await supabase
        .from('workspace_users')
        .select(`
          workspace_id,
          role,
          workspaces:workspace_id (*)
        `)
        .eq('user_id', session.user.id);

      if (memberError) {
        console.error('Error fetching member workspaces:', memberError);
        throw memberError;
      }

      // Combinar os resultados, evitando duplicatas
      const ownedWorkspaceIds = new Set((ownedWorkspaces || []).map(w => w.id));
      
      const ownedWorkspacesWithRole = (ownedWorkspaces || []).map(workspace => ({
        ...workspace,
        user_role: 'owner' as const,
        is_owner: true,
        workspace_users: []
      }));

      // Filtrar workspaces onde o usuário é membro mas NÃO é owner
      const memberWorkspacesWithRole = (memberWorkspaceUsers || [])
        .filter(wu => wu.workspaces && !ownedWorkspaceIds.has(wu.workspaces.id)) // Evitar duplicatas
        .map(wu => ({
          ...wu.workspaces,
          user_role: wu.role as 'admin' | 'user',
          is_owner: false,
          workspace_users: []
        }));

      const allWorkspaces = [...ownedWorkspacesWithRole, ...memberWorkspacesWithRole];

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
  }, [session?.user?.id, sessionLoading, currentWorkspace]);

  const switchWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem('currentWorkspaceId', workspaceId);
    }
  }, [workspaces]);

  const createWorkspace = useCallback(async (name: string, description?: string, isShared: boolean = false): Promise<Workspace | null> => {
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
  }, [session?.user, fetchWorkspaces]);

  // Só executar fetchWorkspaces quando a sessão estiver carregada e houver mudança no usuário
  useEffect(() => {
    if (!sessionLoading) {
      fetchWorkspaces();
    }
  }, [sessionLoading, session?.user?.id]);

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