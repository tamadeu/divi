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
  transferOwnership: (workspaceId: string, newOwnerId: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { session, loading: sessionLoading } = useSession();
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
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
        .eq('workspace_owner', session.user.id)
        .order('created_at', { ascending: true });

      if (ownedError) {
        console.error('Error fetching owned workspaces:', ownedError);
        throw ownedError;
      }

      // Buscar workspaces onde o usuário é membro
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspace_users')
        .select('workspace_id, role')
        .eq('user_id', session.user.id);

      if (memberError) {
        console.error('Error fetching member workspaces:', memberError);
        throw memberError;
      }

      // Para cada workspace onde é membro, buscar os detalhes do workspace
      const memberWorkspaceDetails = [];
      if (memberWorkspaces && memberWorkspaces.length > 0) {
        const workspaceIds = memberWorkspaces.map(mw => mw.workspace_id);
        const { data: workspaceDetails, error: detailsError } = await supabase
          .from('workspaces')
          .select('*')
          .in('id', workspaceIds);

        if (detailsError) {
          console.error('Error fetching workspace details:', detailsError);
        } else {
          // Combinar detalhes do workspace com o papel do usuário
          for (const workspace of workspaceDetails || []) {
            const memberInfo = memberWorkspaces.find(mw => mw.workspace_id === workspace.id);
            if (memberInfo) {
              memberWorkspaceDetails.push({
                ...workspace,
                user_role: memberInfo.role as 'admin' | 'user',
                is_owner: workspace.workspace_owner === session.user.id,
              });
            }
          }
        }
      }

      // Combinar os resultados, evitando duplicatas
      const ownedWorkspaceIds = new Set((ownedWorkspaces || []).map(w => w.id));
      
      const ownedWorkspacesWithRole = (ownedWorkspaces || []).map(workspace => ({
        ...workspace,
        user_role: 'owner' as const,
        is_owner: true,
      }));

      // Filtrar workspaces onde o usuário é membro mas NÃO é owner
      const filteredMemberWorkspaces = memberWorkspaceDetails.filter(
        workspace => !ownedWorkspaceIds.has(workspace.id)
      );

      const allWorkspaces = [...ownedWorkspacesWithRole, ...filteredMemberWorkspaces];

      setWorkspaces(allWorkspaces);

      // Só definir workspace atual se não houver um ou se o atual não existe mais
      if (!currentWorkspace || !allWorkspaces.find(w => w.id === currentWorkspace.id)) {
        const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
        let workspaceToSelect = null;

        if (savedWorkspaceId) {
          workspaceToSelect = allWorkspaces.find(w => w.id === savedWorkspaceId);
        }

        if (!workspaceToSelect && allWorkspaces.length > 0) {
          workspaceToSelect = allWorkspaces[0];
        }

        if (workspaceToSelect) {
          setCurrentWorkspace(workspaceToSelect);
          localStorage.setItem('currentWorkspaceId', workspaceToSelect.id);
        }
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
          workspace_owner: session.user.id,
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

  const transferOwnership = async (workspaceId: string, newOwnerId: string): Promise<boolean> => {
    if (!session?.user) return false;

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ 
          workspace_owner: newOwnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)
        .eq('workspace_owner', session.user.id);

      if (error) throw error;

      await fetchWorkspaces();
      return true;
    } catch (error: any) {
      console.error('Error transferring ownership:', error);
      showError('Erro ao transferir propriedade do núcleo');
      return false;
    }
  };

  // CORRIGIDO: useEffect com dependências corretas para evitar loop infinito
  useEffect(() => {
    if (!sessionLoading && session?.user?.id) {
      fetchWorkspaces();
    }
  }, [sessionLoading, session?.user?.id]); // Removido fetchWorkspaces das dependências

  const value = {
    currentWorkspace,
    workspaces,
    loading,
    switchWorkspace,
    refreshWorkspaces: fetchWorkspaces,
    createWorkspace,
    transferOwnership
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